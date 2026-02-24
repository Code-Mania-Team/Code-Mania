import ExamModel from "../models/exam.js";

function coerceTestCases(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  // Accept JSON already parsed
  if (Array.isArray(value) || typeof value === "object") return value;

  // Accept JSON string
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

class AdminExamService {
  constructor() {
    this.exam = new ExamModel();
  }

  async updateProblem(problemId, body) {
    const update = {};

    if (body.problem_title !== undefined) update.problem_title = body.problem_title;
    if (body.problem_description !== undefined)
      update.problem_description = body.problem_description;
    if (body.starting_code !== undefined) update.starting_code = body.starting_code;
    if (body.solution !== undefined) update.solution = body.solution;
    if (body.exp !== undefined) update.exp = Number(body.exp);
    if (body.programming_language_id !== undefined)
      update.programming_language_id = Number(body.programming_language_id);

    const coercedTestCases = coerceTestCases(body.test_cases);
    if (body.test_cases !== undefined && coercedTestCases === undefined) {
      return {
        ok: false,
        status: 400,
        message: "test_cases must be valid JSON (array/object)",
      };
    }
    if (coercedTestCases !== undefined) update.test_cases = coercedTestCases;

    // Basic validation
    if (update.exp !== undefined && (!Number.isFinite(update.exp) || update.exp <= 0)) {
      return { ok: false, status: 400, message: "exp must be a positive number" };
    }
    if (
      update.programming_language_id !== undefined &&
      (!Number.isFinite(update.programming_language_id) || update.programming_language_id <= 0)
    ) {
      return {
        ok: false,
        status: 400,
        message: "programming_language_id must be a valid number",
      };
    }

    const hasAnyField = Object.keys(update).length > 0;
    if (!hasAnyField) {
      return { ok: false, status: 400, message: "No fields provided for update" };
    }

    const updated = await this.exam.updateProblem(problemId, update);
    if (!updated) {
      return { ok: false, status: 404, message: "Problem not found" };
    }

    return { ok: true, data: updated };
  }
}

export default AdminExamService;
