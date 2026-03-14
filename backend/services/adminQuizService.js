import QuizModel from "../models/quiz.js";

function coerceJson(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (Array.isArray(value) || typeof value === "object") return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return JSON.parse(trimmed);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

class AdminQuizService {
  constructor(model = new QuizModel()) {
    this.quiz = model;
  }

  async listQuizzes({ languageSlug } = {}) {
    try {
      const rows = await this.quiz.listQuizzes({ languageSlug });
      return { ok: true, data: rows || [] };
    } catch (err) {
      return {
        ok: false,
        status: 500,
        message: err?.message || "Failed to list quizzes",
      };
    }
  }

  async getQuiz(quizId) {
    try {
      const quiz = await this.quiz.getQuizById(quizId);
      if (!quiz) return { ok: false, status: 404, message: "Quiz not found" };
      return { ok: true, data: quiz };
    } catch (err) {
      return {
        ok: false,
        status: 500,
        message: err?.message || "Failed to fetch quiz",
      };
    }
  }

  async updateQuiz(quizId, body) {
    const update = {};

    if (body.quiz_title !== undefined) update.quiz_title = body.quiz_title;
    if (body.quiz_description !== undefined) update.quiz_description = body.quiz_description;
    if (body.title !== undefined) update.title = body.title;
    if (body.route !== undefined) update.route = body.route;

    if (body.quiz_type !== undefined) {
      const qt = String(body.quiz_type || "").toLowerCase();
      if (qt !== "mcq" && qt !== "code") {
        return { ok: false, status: 400, message: "quiz_type must be 'mcq' or 'code'" };
      }
      update.quiz_type = qt;
    }

    if (body.exp_total !== undefined) {
      if (body.exp_total === null || body.exp_total === "") {
        update.exp_total = null;
      } else {
        const n = Number(body.exp_total);
        if (!Number.isFinite(n) || n < 0) {
          return { ok: false, status: 400, message: "exp_total must be a non-negative number" };
        }
        update.exp_total = Math.round(n);
      }
    }

    if (body.code_prompt !== undefined) {
      if (typeof body.code_prompt === "string") {
        update.code_prompt = body.code_prompt;
      } else if (body.code_prompt === null) {
        update.code_prompt = null;
      } else {
        // store JSON-ish prompts as string; quiz API can parse it back
        try {
          update.code_prompt = JSON.stringify(body.code_prompt);
        } catch {
          return { ok: false, status: 400, message: "code_prompt must be a string or JSON-serializable" };
        }
      }
    }

    if (body.starting_code !== undefined) update.starting_code = body.starting_code;

    const coercedTestCases = coerceJson(body.test_cases);
    if (body.test_cases !== undefined && coercedTestCases === undefined) {
      return {
        ok: false,
        status: 400,
        message: "test_cases must be valid JSON (array/object)",
      };
    }
    if (coercedTestCases !== undefined) update.test_cases = coercedTestCases;

    const hasAnyField = Object.keys(update).length > 0;
    if (!hasAnyField) {
      return { ok: false, status: 400, message: "No fields provided for update" };
    }

    try {
      const updated = await this.quiz.updateQuiz(quizId, update);
      if (!updated) return { ok: false, status: 404, message: "Quiz not found" };
      return { ok: true, data: updated };
    } catch (err) {
      return {
        ok: false,
        status: 500,
        message: err?.message || "Failed to update quiz",
      };
    }
  }
}

export default AdminQuizService;
