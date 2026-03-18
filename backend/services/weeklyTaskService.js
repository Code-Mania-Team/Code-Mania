import axios from "axios";
import WeeklyTask from "../models/weeklyTask.js";
import UserCosmetics from "../models/userCosmetics.js";
import UserPreferences from "../models/userPreferences.js";
import Cosmetics from "../models/cosmetics.js";
import Notification from "../models/notification.js";

const TERMINAL_API_BASE_URL = process.env.TERMINAL_API_BASE_URL || "https://terminal.codemania.fun";

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .join("\n")
    .trim();
}

function tryParseJson(value) {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: true, value };
  const s = value.trim();
  if (!s) return { ok: true, value: "" };

  // Only attempt JSON parsing when it looks like JSON.
  const looksJson =
    s.startsWith("[") ||
    s.startsWith("{") ||
    s === "true" ||
    s === "false" ||
    s === "null" ||
    /^-?\d+(?:\.\d+)?$/.test(s);

  if (!looksJson) return { ok: true, value: s };

  try {
    return { ok: true, value: JSON.parse(s) };
  } catch {
    return { ok: false, value: s };
  }
}

function normalizeTestCases(raw, { language } = {}) {
  const list = Array.isArray(raw) ? raw : [];
  const lang = String(language || "").toLowerCase();

  return list
    .map((tc) => {
      const explicitMode = String(tc?.mode || "").trim().toLowerCase();
      const explicitFunctionName = tc?.functionName || tc?.function_name || tc?.fn || null;

      const inputRaw = tc?.input ?? "";
      const expectedRaw = tc?.expected ?? tc?.expected_output ?? tc?.expectedOutput ?? tc?.output ?? "";
      const is_hidden = Boolean(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden);

      // If a task explicitly sets function mode, pass it through (any language).
      if (explicitMode === "function") {
        return {
          mode: "function",
          functionName: explicitFunctionName ? String(explicitFunctionName) : "solution",
          input: inputRaw,
          expected: expectedRaw,
          is_hidden,
        };
      }

      // JavaScript weekly tasks run in function mode to avoid needing stdin/fs/process access.
      if (lang === "javascript") {
        const inputParsed = tryParseJson(inputRaw).value;
        const expectedParsed = tryParseJson(expectedRaw).value;
        return {
          mode: "function",
          functionName: "solution",
          input: inputParsed,
          expected: expectedParsed,
          is_hidden,
        };
      }

      return {
        input: String(inputRaw ?? ""),
        expected: String(expectedRaw ?? ""),
        is_hidden,
      };
    })
    .filter((tc) => {
      const input = typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input ?? "");
      const expected = typeof tc.expected === "string" ? tc.expected : JSON.stringify(tc.expected ?? "");
      return normalizeText(input) || normalizeText(expected);
    });
}

class WeeklyTaskService {
  constructor() {
    this.weekly = new WeeklyTask();
    this.userCosmetics = new UserCosmetics();
    this.userPreferences = new UserPreferences();
    this.cosmetics = new Cosmetics();
    this.notifications = new Notification();
  }

  pickDeterministicRewardKey({ taskId, enabledCosmetics }) {
    const list = Array.isArray(enabledCosmetics) ? enabledCosmetics : [];
    const frames = list.filter((c) => c?.type === "avatar_frame" && c?.key);
    const skins = list.filter((c) => c?.type === "terminal_skin" && c?.key);
    if (!frames.length && !skins.length) return null;
    const useSkin = skins.length > 0 && taskId % 5 === 0;
    const pool = useSkin ? skins : frames.length ? frames : skins;
    if (!pool.length) return null;
    return String(pool[taskId % pool.length].key);
  }

  async getTaskSafe({ taskId, userId }) {
    const task = await this.weekly.getTaskById(taskId);
    if (!task) return null;

    // Attach user progress if exists
    const progress = await this.weekly.getUserWeeklyTaskProgress({ userId, taskId });

    const { solution_code, ...safe } = task;

    return {
      ...safe,
      userStatus: progress?.status || "not_started",
      completedAt: progress?.completed_at || null,
      xpAwarded: progress?.xp_awarded || 0,
    };
  }

  async submit({ userId, taskId, code }) {
    const PASS_THRESHOLD = 70;

    const task = await this.weekly.getTaskById(taskId);
    if (!task) return { ok: false, status: 404, message: "Weekly task not found" };

    const existingProgress = await this.weekly.getUserWeeklyTaskProgress({ userId, taskId }).catch(() => null);
    const alreadyCompleted = String(existingProgress?.status || "") === "completed";

    const language = String(task.language || task?.programming_languages?.slug || "javascript").toLowerCase();
    const testCases = normalizeTestCases(task.test_cases, { language });

    const { data: execution } = await axios.post(
      `${TERMINAL_API_BASE_URL}/exam/run`,
      {
        language,
        code,
        testCases,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_KEY,
        },
      }
    );

    const totalTests = Number(execution?.total || 0);
    const passedTests = Number(execution?.passed || 0);
    const scorePercentage = Number(execution?.score || 0);
    const passed = scorePercentage >= PASS_THRESHOLD;

    // Ensure user has an in_progress row once they submit
    await this.weekly.acceptTask(userId, taskId);

    let xpAdded = 0;
    let unlockedCosmeticKey = null;
    let unlockedCosmetic = null;
    if (passed && !alreadyCompleted) {
      xpAdded = Number(task.reward_xp || 0);
      if (xpAdded) {
        await this.weekly.addXp(userId, xpAdded);
      }
      await this.weekly.completeTask(userId, taskId, xpAdded);

      const rewardKey = task.reward_avatar_frame_key || task.reward_terminal_skin_id || null;
      const diff = String(task?.difficulty || "").toLowerCase();
      let finalRewardKey = rewardKey;

      // If hard task has no persisted reward, compute deterministic one.
      if (!finalRewardKey && diff === "hard") {
        try {
          const enabled = await this.cosmetics.listEnabledByTypes(["avatar_frame", "terminal_skin"]);
          finalRewardKey = this.pickDeterministicRewardKey({ taskId, enabledCosmetics: enabled });
        } catch {
          finalRewardKey = null;
        }
      }

      if (finalRewardKey) {
        try {
          const cosmeticRow = (await this.cosmetics.getByKeys([finalRewardKey]))?.[0] || null;
          unlockedCosmetic = cosmeticRow
            ? { key: cosmeticRow.key, type: cosmeticRow.type, name: cosmeticRow.name, asset_url: cosmeticRow.asset_url, rarity: cosmeticRow.rarity }
            : null;

          await this.userCosmetics.unlockOnce({
            user_id: userId,
            cosmetic_key: finalRewardKey,
            source_type: "weekly_task",
            source_id: taskId,
          });

          unlockedCosmeticKey = finalRewardKey;

          if (task.reward_avatar_frame_key || (diff === "hard" && String(finalRewardKey).startsWith("frame_"))) {
            await this.userPreferences.setAvatarFrameIfEmpty({
              user_id: userId,
              avatar_frame_key: task.reward_avatar_frame_key || finalRewardKey,
            });
          }
        } catch {
          // Best-effort only
        }
      }

      // Congratulate + tell rewards (deduped per task)
      try {
        const parts = [];
        if (xpAdded) parts.push(`+${xpAdded} XP`);
        if (unlockedCosmetic?.name) parts.push(`Unlocked: ${unlockedCosmetic.name}`);
        const message = parts.length
          ? `Congrats! ${parts.join(". ")}.`
          : "Congrats! Weekly challenge completed.";

        await this.notifications.createOnce({
          user_id: userId,
          type: "system",
          title: "Weekly Challenge Complete",
          message,
          metadata: {
            kind: "weekly_challenge_complete",
            task_id: taskId,
            earned_xp: xpAdded,
            unlocked_cosmetic_key: unlockedCosmeticKey,
            unlocked_cosmetic: unlockedCosmetic,
          },
          dedupe_key: `weekly_task_complete:${taskId}`,
        });
      } catch {
        // Best-effort
      }
    }

    return {
      ok: true,
      data: {
        score_percentage: scorePercentage,
        passed,
        already_completed: alreadyCompleted,
        earned_xp: passed && !alreadyCompleted ? xpAdded : 0,
        xp_added: passed && !alreadyCompleted ? xpAdded : 0,
        unlocked_cosmetic_key: passed && !alreadyCompleted ? unlockedCosmeticKey : null,
        unlocked_cosmetic: passed && !alreadyCompleted ? unlockedCosmetic : null,
        attempt_number: 1,
        passed_tests: passedTests,
        total_tests: totalTests,
        results: execution?.results || [],
      },
    };
  }
}

export default WeeklyTaskService;
