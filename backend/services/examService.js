import ExamModel from "../models/exam.js";

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .join("\n")
    .trim();
}

class ExamService {
  constructor() {
    this.exam = new ExamModel();
  }

  async listProblems({ languageSlug } = {}) {
    const problems = await this.exam.listProblems({ languageSlug });

    return (problems || []).map((p) => ({
      id: p.id,
      problem_title: p.problem_title,
      problem_description: p.problem_description,
      exp: p.exp,
      programming_language: p.programming_languages
        ? {
            id: p.programming_languages.id,
            slug: p.programming_languages.slug,
            name: p.programming_languages.name,
          }
        : null,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
  }

  async getProblemSafe(problemId) {
    const problem = await this.exam.getProblemById(problemId);
    if (!problem) return null;

    const testCases = Array.isArray(problem.test_cases) ? problem.test_cases : [];

    return {
      id: problem.id,
      problem_title: problem.problem_title,
      problem_description: problem.problem_description,
      starting_code: problem.starting_code,
      exp: problem.exp,
      programming_language: problem.programming_languages
        ? {
            id: problem.programming_languages.id,
            slug: problem.programming_languages.slug,
            name: problem.programming_languages.name,
          }
        : null,
      meta: {
        test_case_count: testCases.length,
      },
      created_at: problem.created_at,
      updated_at: problem.updated_at,
    };
  }

  async startAttempt({ userId, problemId }) {
    const problem = await this.exam.getProblemById(problemId);
    if (!problem) return { ok: false, status: 404, message: "Problem not found" };

    const languageSlug = problem.programming_languages?.slug;
    if (!languageSlug) {
      return { ok: false, status: 400, message: "Problem language not found" };
    }

    const attemptNumber = await this.exam.getNextAttemptNumber({ userId, problemId });
    const attempt = await this.exam.createAttempt({
      userId,
      problemId,
      languageSlug,
      attemptNumber,
    });

    return {
      ok: true,
      data: {
        attemptId: attempt.id,
        attempt_number: attempt.attempt_number,
        problem: {
          id: problem.id,
          problem_title: problem.problem_title,
          problem_description: problem.problem_description,
          starting_code: problem.starting_code,
          exp: problem.exp,
          programming_language: problem.programming_languages
            ? {
                id: problem.programming_languages.id,
                slug: problem.programming_languages.slug,
                name: problem.programming_languages.name,
              }
            : null,
        },
      },
    };
  }

  async submitAttempt({ userId, attemptId, code }) {
    const attempt = await this.exam.getAttemptById({ attemptId });
    if (!attempt) return { ok: false, status: 404, message: "Attempt not found" };
    if (String(attempt.user_id) !== String(userId)) {
      return { ok: false, status: 403, message: "Forbidden" };
    }

    const problemId = Number(attempt.exam_problem_id);
    const problem = await this.exam.getProblemById(problemId);
    if (!problem) return { ok: false, status: 404, message: "Problem not found" };

    const mode = String(process.env.EXAM_EVALUATION_MODE || "solution_match");
    let scorePercentage = 0;
    let passed = false;
    const details = { mode };

    if (mode === "solution_match") {
      const normalizedSubmitted = normalizeText(code);
      const normalizedSolution = normalizeText(problem.solution);
      passed = normalizedSubmitted === normalizedSolution;
      scorePercentage = passed ? 100 : 0;
      details.match = passed;
    } else {
      return {
        ok: false,
        status: 501,
        message: "Exam evaluation mode not implemented",
        data: { mode },
      };
    }

    // Award XP only once per problem per user (first pass).
    let earnedXp = 0;
    const alreadyPassed = await this.exam.userHasPassedProblem({ userId, problemId: problem.id });
    if (passed && !alreadyPassed) earnedXp = Number(problem.exp || 0);

    const updated = await this.exam.updateAttemptResult({
      attemptId,
      scorePercentage,
      passed,
      earnedXp,
    });

    await this.exam.addXp(userId, earnedXp);

    return {
      ok: true,
      data: {
        attempt: updated,
        score_percentage: scorePercentage,
        passed,
        earned_xp: earnedXp,
        alreadyPassed,
        details,
      },
    };
  }

  async listAttempts({ userId, languageSlug, problemId, limit }) {
    const attempts = await this.exam.listUserAttempts({
      userId,
      languageSlug,
      problemId,
      limit,
    });
    return attempts || [];
  }

  async status({ userId, languageSlug }) {
    return this.exam.getUserExamStatus({ userId, languageSlug });
  }
}

export default ExamService;
