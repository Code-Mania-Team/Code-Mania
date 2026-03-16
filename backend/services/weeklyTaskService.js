import axios from "axios";
import WeeklyTask from "../models/weeklyTask.js";
import UserCosmetics from "../models/userCosmetics.js";
import UserPreferences from "../models/userPreferences.js";
import Cosmetics from "../models/cosmetics.js";

const TERMINAL_API_BASE_URL = process.env.TERMINAL_API_BASE_URL || "https://terminal.codemania.fun";

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .join("\n")
    .trim();
}

function normalizeTestCases(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((tc) => {
      const input = tc?.input ?? "";
      const expected = tc?.expected ?? tc?.expected_output ?? tc?.expectedOutput ?? tc?.output ?? "";
      const is_hidden = Boolean(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden);
      return {
        input: String(input ?? ""),
        expected: String(expected ?? ""),
        is_hidden,
      };
    })
    .filter((tc) => normalizeText(tc.input) || normalizeText(tc.expected));
}

class WeeklyTaskService {
  constructor() {
    this.weekly = new WeeklyTask();
    this.userCosmetics = new UserCosmetics();
    this.userPreferences = new UserPreferences();
    this.cosmetics = new Cosmetics();
  }

  async claimReward({ userId, taskId }) {
    const task = await this.weekly.getTaskById(taskId);
    if (!task) return { ok: false, status: 404, message: "Weekly task not found" };

    const diff = String(task?.difficulty || "").toLowerCase();
    let rewardKey = task.reward_avatar_frame_key || task.reward_terminal_skin_id || null;

    if (!rewardKey && diff === "hard") {
      try {
        const enabled = await this.cosmetics.listEnabledByTypes(["avatar_frame", "terminal_skin"]);
        rewardKey = this.pickDeterministicRewardKey({ taskId, enabledCosmetics: enabled });
      } catch {
        rewardKey = null;
      }
    }

    if (!rewardKey) {
      return { ok: false, status: 400, message: "No reward configured for this task" };
    }

    const cosmetic = (await this.cosmetics.getByKeys([rewardKey]))?.[0] || null;

    await this.userCosmetics.unlockOnce({
      user_id: userId,
      cosmetic_key: rewardKey,
      source_type: "weekly_task_claim_test",
      source_id: taskId,
    });

    if (cosmetic?.type === "avatar_frame") {
      await this.userPreferences.setAvatarFrameIfEmpty({
        user_id: userId,
        avatar_frame_key: rewardKey,
      });
    }

    return {
      ok: true,
      data: {
        unlocked_cosmetic_key: rewardKey,
        cosmetic: cosmetic
          ? { key: cosmetic.key, type: cosmetic.type, name: cosmetic.name, asset_url: cosmetic.asset_url, rarity: cosmetic.rarity }
          : null,
      },
    };
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

    const language = String(task.language || task?.programming_languages?.slug || "javascript").toLowerCase();
    const testCases = normalizeTestCases(task.test_cases);

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
    if (passed) {
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
    }

    return {
      ok: true,
      data: {
        score_percentage: scorePercentage,
        passed,
        earned_xp: passed ? xpAdded : 0,
        xp_added: passed ? xpAdded : 0,
        unlocked_cosmetic_key: passed ? unlockedCosmeticKey : null,
        attempt_number: 1,
        passed_tests: passedTests,
        total_tests: totalTests,
        results: execution?.results || [],
      },
    };
  }
}

export default WeeklyTaskService;
