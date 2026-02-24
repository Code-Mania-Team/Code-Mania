import ExamModel from "../models/exam.js";
import DockerService from "./dockerService.js";

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
    this.docker = new DockerService();
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
    const existing = await this.exam.getLatestAttempt({
      userId,
      problemId
    });

    if (existing) {
      return {
        ok: true,
        data: existing
      };
    }

    const problem = await this.exam.getProblemById(problemId);
    if (!problem)
      return { ok: false, status: 404, message: "Problem not found" };

    const languageSlug = problem.programming_languages?.slug;

    const attemptNumber =
      await this.exam.getNextAttemptNumber({ userId, problemId });

    const attempt = await this.exam.createAttempt({
      userId,
      problemId,
      languageId: languageSlug,
      attemptNumber
    });

    return {
      ok: true,
      data: attempt
    };
  }

  async submitAttempt({ userId, attemptId, code }) {
    const MAX_ATTEMPTS = 5;
    const PASS_THRESHOLD = 70;

    const attempt = await this.exam.getAttemptById({ attemptId });
    if (!attempt)
      return { ok: false, status: 404, message: "Attempt not found" };

    if (String(attempt.user_id) !== String(userId))
      return { ok: false, status: 403, message: "Forbidden" };

    if (attempt.attempt_number >= MAX_ATTEMPTS)
      return {
        ok: false,
        status: 400,
        message: "Maximum attempts reached"
      };

    const problem = await this.exam.getProblemById(
      Number(attempt.exam_problem_id)
    );

    if (!problem)
      return { ok: false, status: 404, message: "Problem not found" };

    const newAttemptNumber = attempt.attempt_number + 1;

    /* =====================================
      IF USER ALREADY HAS 100% → LOCK
    ===================================== */

    if (attempt.score_percentage === 100) {
      const updated = await this.exam.updateAttemptFull({
        attemptId,
        scorePercentage: 100,
        passed: true,
        earnedXp: attempt.earned_xp,
        attemptNumber: newAttemptNumber
      });

      return {
        ok: true,
        data: {
          attempt: updated,
          score_percentage: 100,
          passed: true,
          earned_xp: attempt.earned_xp,
          xp_added: 0,
          attempt_number: newAttemptNumber,
          locked: true
        }
      };
    }

    /* =====================================
      RUN TESTS
    ===================================== */

    const execution = await this.docker.runExam({
      language: attempt.language,
      code,
      testCases: problem.test_cases || []
    });

    const totalTests = execution.total;
    const passedTests = execution.passed;
    const scorePercentage = execution.score;

    /* =====================================
      SOFT PENALTY SYSTEM
      - 2 free attempts
      - 5% penalty after
      - minimum 85% modifier
    ===================================== */

    const baseXp = Number(problem.exp || 0);
    const scoreRatio =
      totalTests === 0 ? 0 : passedTests / totalTests;

    const penaltySteps = Math.max(0, newAttemptNumber - 2);
    const penaltyRate = 0.05;
    const minModifier = 0.85;

    const attemptModifier = Math.max(
      minModifier,
      1 - (penaltySteps * penaltyRate)
    );

    const calculatedXp = Math.round(
      baseXp * scoreRatio * attemptModifier
    );

    /* =====================================
      XP NEVER DECREASES
    ===================================== */

    const previousXp = attempt.earned_xp || 0;

    let finalXp = previousXp;
    let xpDifference = 0;

    if (calculatedXp > previousXp) {
      finalXp = calculatedXp;
      xpDifference = calculatedXp - previousXp;
      await this.exam.addXp(userId, xpDifference);
    }

    const passed = scorePercentage >= PASS_THRESHOLD;

    /* =====================================
      UPDATE SAME ROW
    ===================================== */

    const updated = await this.exam.updateAttemptFull({
      attemptId,
      scorePercentage,
      passed,
      earnedXp: finalXp,
      attemptNumber: newAttemptNumber
    });

    return {
      ok: true,
      data: {
        attempt: updated,
        score_percentage: scorePercentage,
        passed,
        earned_xp: finalXp,
        xp_added: xpDifference,
        attempt_number: newAttemptNumber,
        passed_tests: passedTests,
        total_tests: totalTests,
        results: execution.results
      }
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
