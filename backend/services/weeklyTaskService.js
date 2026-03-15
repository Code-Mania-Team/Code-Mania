import axios from "axios";
import WeeklyTask from "../models/weeklyTask.js";

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
    if (passed) {
      xpAdded = Number(task.reward_xp || 0);
      if (xpAdded) {
        await this.weekly.addXp(userId, xpAdded);
      }
      await this.weekly.completeTask(userId, taskId, xpAdded);
    }

    return {
      ok: true,
      data: {
        score_percentage: scorePercentage,
        passed,
        earned_xp: passed ? xpAdded : 0,
        xp_added: passed ? xpAdded : 0,
        attempt_number: 1,
        passed_tests: passedTests,
        total_tests: totalTests,
        results: execution?.results || [],
      },
    };
  }
}

export default WeeklyTaskService;
