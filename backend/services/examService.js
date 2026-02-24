import ExamModel from "../models/exam.js";
import axios from "axios";

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

  async startAttempt({ userId, languageSlug }) {

    // 1️⃣ Get problem by language
    const problems = await this.exam.listProblems({ languageSlug });

    if (!problems.length) {
      return { ok: false, status: 404, message: "Exam not found for language" };
    }

    // Because 1 exam per language
    const problemId = problems[0].id;

    // 2️⃣ Check existing attempt
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

    // 3️⃣ Create new attempt
    const attemptNumber =
      await this.exam.getNextAttemptNumber({ userId, problemId });

    const attempt = await this.exam.createAttempt({
      userId,
      problemId,
      languageSlug,
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

    // 🔒 LOCK IF 100%
    if (attempt.score_percentage === 100) {
      return {
        ok: true,
        data: {
          score_percentage: 100,
          passed: true,
          earned_xp: attempt.earned_xp,
          xp_added: 0,
          attempt_number: attempt.attempt_number,
          locked: true
        }
      };
    }

    // Submission number = current + 1
    const submissionNumber = attempt.attempt_number + 1;

    if (submissionNumber > MAX_ATTEMPTS) {
      return {
        ok: false,
        status: 400,
        message: "Maximum attempts reached"
      };
    }

    const problem = await this.exam.getProblemById(
      Number(attempt.exam_problem_id)
    );

    if (!problem)
      return { ok: false, status: 404, message: "Problem not found" };

    /* =====================================
       RUN TESTS
    ===================================== */
    const { data: execution } = await axios.post(
      "https://terminal.codemania.fun/exam/run",
      {
        language: attempt.language,
        code,
        testCases: problem.test_cases || []
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_KEY
        }
      }
    );

    const totalTests = execution.total;
    const passedTests = execution.passed;
    const scorePercentage = execution.score;

    /* =====================================
       PENALTY SYSTEM (0-based attempts)
       1st submission → no penalty
       2nd submission → no penalty
       3rd submission → 5%
       4th submission → 10%
       5th submission → 15%
    ===================================== */

    const baseXp = Number(problem.exp || 0);
    const scoreRatio =
      totalTests === 0 ? 0 : passedTests / totalTests;

    const penaltySteps = Math.max(0, submissionNumber - 2);
    const penaltyRate = 0.05;
    const minModifier = 0.85;

    const attemptModifier = Math.max(
      minModifier,
      1 - (penaltySteps * penaltyRate)
    );

    const calculatedXp = Math.round(
      baseXp * scoreRatio * attemptModifier
    );

    const passed = scorePercentage >= PASS_THRESHOLD;

    /* =====================================
       APPLY XP DIFFERENCE (ADD OR SUBTRACT)
    ===================================== */

    const previousXp = attempt.earned_xp || 0;
    const xpDifference = calculatedXp - previousXp;

    if (xpDifference !== 0) {
      await this.exam.addXp(userId, xpDifference);
    }

    /* =====================================
       UPDATE ATTEMPT
    ===================================== */

    const updated = await this.exam.updateAttemptFull({
      attemptId,
      scorePercentage,
      passed,
      earnedXp: calculatedXp,
      attemptNumber: submissionNumber
    });

    return {
      ok: true,
      data: {
        attempt: updated,
        score_percentage: scorePercentage,
        passed,
        earned_xp: calculatedXp,
        xp_added: xpDifference,
        attempt_number: submissionNumber,
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
