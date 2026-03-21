import QuizModel from "../models/quiz.js";
import axios from "axios";

const TERMINAL_API_BASE_URL = process.env.TERMINAL_API_BASE_URL || "https://terminal.codemania.fun";

function toJsonIfNeeded(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function stripRunnerHelper({ language, code }) {
  const s = String(code || "");
  if (!s.trim()) return s;

  const markers = [];
  if (language === "python") {
    markers.push("\n# Runner helper");
    markers.push("\n# Terminal runner helper");
  } else if (language === "javascript") {
    markers.push("\n// Runner helper");
    markers.push("\n// Terminal runner helper");
  } else if (language === "cpp") {
    markers.push("\n// Terminal runner helper");
    markers.push("\n\nint main(");
  }

  let cut = -1;
  for (const m of markers) {
    const idx = s.indexOf(m);
    if (idx !== -1 && (cut === -1 || idx < cut)) cut = idx;
  }
  if (cut === -1) return s;
  return s.slice(0, cut).trimEnd();
}

function coerceBool(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 1) return true;
  if (value === 0) return false;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no" || s === "") return false;
  }
  return Boolean(value);
}

function filterVisibleTestCases(testCases) {
  const list = Array.isArray(testCases) ? testCases : [];
  const visible = list.filter((tc) => !coerceBool(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden));
  return visible.length ? visible : list;
}

function sanitizeExecutionResults({ testCases, results }) {
  const tcArr = Array.isArray(testCases) ? testCases : [];
  const rows = Array.isArray(results) ? results : [];

  return rows.map((r, i) => {
    const idx = Number(r?.test_index ?? r?.testIndex ?? i + 1);
    const tc = tcArr[idx - 1] || {};
    const hidden = coerceBool(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden ?? r?.is_hidden ?? r?.isHidden ?? r?.hidden);

    if (!hidden) {
      return { ...r, is_hidden: false };
    }

    return {
      ...r,
      is_hidden: true,
      expected: "",
      stdout: "",
      stdout_display: "",
    };
  });
}

function parseMaybeJsonPrompt(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return "";
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");
  if (!looksJson) return value;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return { sections: parsed };
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.sections)) {
      return parsed;
    }
    return value;
  } catch {
    return value;
  }
}

function buildExecutionFromRunnerError(err, testCases) {
  const upstream = err?.response?.data;
  const statusCode = err?.response?.status;
  const statusText = err?.response?.statusText;

  const readText = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
  };

  const collectCandidates = (obj) => {
    if (!obj || typeof obj !== "object") return [];
    return [
      readText(obj.message),
      readText(obj.error),
      readText(obj.details),
      readText(obj.compile_error),
      readText(obj.compileError),
      readText(obj.stderr),
      readText(obj.stdout),
      readText(obj.output),
      readText(obj.trace),
      readText(obj.reason),
      readText(obj.data?.message),
      readText(obj.data?.error),
      readText(obj.data?.details),
      readText(obj.data?.stderr),
      readText(obj.data?.output),
    ].filter(Boolean);
  };

  if (upstream && typeof upstream === "object") {
    const hasStructuredResult =
      Array.isArray(upstream.results) ||
      Number.isFinite(Number(upstream.total)) ||
      Number.isFinite(Number(upstream.passed)) ||
      Number.isFinite(Number(upstream.score));

    if (hasStructuredResult) {
      return {
        total: Number(upstream.total || (Array.isArray(testCases) ? testCases.length : 0)),
        passed: Number(upstream.passed || 0),
        score: Number(upstream.score || 0),
        results: Array.isArray(upstream.results) ? upstream.results : [],
      };
    }
  }

  const candidates = [
    readText(upstream),
    ...collectCandidates(upstream),
    readText(err?.message),
    readText(err?.code),
  ].filter(Boolean);

  const baseMessage = candidates[0] || "Execution failed";
  const statusPrefix = statusCode ? `Runner ${statusCode}${statusText ? ` ${statusText}` : ""}: ` : "";
  const message = `${statusPrefix}${baseMessage}`;

  const list = Array.isArray(testCases) ? testCases : [];
  return {
    total: list.length,
    passed: 0,
    score: 0,
    results: list.map((tc, idx) => ({
      test_index: idx + 1,
      passed: false,
      expected: tc?.expected ?? "",
      stdout: message,
      stdout_display: message,
      execution_time_ms: 0,
    })),
  };
}

class QuizService {
  constructor(model = new QuizModel()) {
    this.model = model;
  }

  async resolveIsAdmin(userId, tokenRole) {
    if (tokenRole === "admin") return true;
    if (!userId) return false;

    try {
      const role = await this.model.getUserRole(userId);
      return role === "admin";
    } catch {
      return false;
    }
  }

  async getQuizByLanguageAndStage(language, quizId) {
    const stageNumber = Number(quizId);
    if (!Number.isFinite(stageNumber)) {
      return { ok: false, status: 400, message: "Invalid quizId" };
    }

    let languageData;
    try {
      languageData = await this.model.getLanguageBySlug(language);
    } catch {
      return { ok: false, status: 404, message: "Language not found" };
    }

    let quizData;
    try {
      quizData = await this.model.getQuizByLanguageAndStage({
        programmingLanguageId: languageData.id,
        stageNumber,
        select: "*",
      });
    } catch {
      return { ok: false, status: 404, message: "Quiz not found" };
    }

    const questions = await this.model.getQuestionsByQuizId(quizData.id);
    let quizType = quizData.quiz_type;
    if (!quizType) {
      quizType = stageNumber >= 2 && stageNumber <= 4 ? "code" : "mcq";
    }
    quizType = String(quizType).toLowerCase() === "code" ? "code" : "mcq";

    const responseData = {
      quiz_title: quizData.quiz_title,
      quiz_type: quizType,
    };

    if (quizType === "mcq") {
      responseData.questions = questions;
    } else {
      const parsedDescription = parseMaybeJsonPrompt(quizData.quiz_description);
      const parsedCodePrompt = parseMaybeJsonPrompt(quizData.code_prompt);
      const learnerPrompt = parsedDescription || parsedCodePrompt || "";

      responseData.quiz_description = learnerPrompt;
      responseData.code_prompt = learnerPrompt;

      const effectiveStarting = quizData.starting_code || "";
      responseData.starting_code = stripRunnerHelper({ language, code: effectiveStarting });
      responseData.exp_total = quizData.exp_total || 500;
      
      const normalizeTestCase = (tc) => {
        const isHidden = Boolean(tc?.is_hidden ?? tc?.isHidden);
        const input = tc?.input ?? tc?.stdin ?? "";
        const expected = tc?.expected ?? tc?.expected_output ?? tc?.expectedOutput ?? "";
        return {
          input: input === null || input === undefined ? "" : String(input),
          expected: expected === null || expected === undefined ? "" : String(expected),
          is_hidden: isHidden,
        };
      };

      let realTestCases = Array.isArray(quizData.test_cases)
        ? quizData.test_cases.map(normalizeTestCase)
        : [];
      let testCases = realTestCases;
      
      responseData.meta = {
        test_case_count: testCases.length,
      };
      
      responseData.test_cases = testCases.map((tc) => {
        const normalized = normalizeTestCase(tc);
        return {
          input: normalized.is_hidden ? "Hidden test case" : normalized.input,
          expected: normalized.is_hidden ? "Hidden" : normalized.expected,
          is_hidden: normalized.is_hidden,
        };
      });
    }

    return {
      ok: true,
      data: responseData,
    };
  }

  async completeQuiz({ userId, tokenRole, language, quizId, payload }) {
    if (!userId) {
      return { ok: false, status: 401, message: "Unauthorized" };
    }

    const stageNumber = Number(quizId);
    if (!Number.isFinite(stageNumber)) {
      return { ok: false, status: 400, message: "Invalid quizId" };
    }

    let languageData;
    try {
      languageData = await this.model.getLanguageBySlug(language);
    } catch {
      return { ok: false, status: 404, message: "Language not found" };
    }

    let quizData;
    try {
      quizData = await this.model.getQuizByLanguageAndStage({
        programmingLanguageId: languageData.id,
        stageNumber,
        select: "*", // Need everything to run tests
      });
    } catch {
      return { ok: false, status: 404, message: "Quiz not found" };
    }

    const isAdmin = await this.resolveIsAdmin(userId, tokenRole);
    let quizType = quizData.quiz_type;
    if (!quizType) {
      quizType = stageNumber >= 2 && stageNumber <= 4 ? "code" : "mcq";
    }
    quizType = String(quizType).toLowerCase() === "code" ? "code" : "mcq";

    if (quizType === "mcq") {
      if (isAdmin) {
        return { ok: true, data: { success: true, preview: true } };
      }

      const scorePercentage = Number(payload.score_percentage || 0);
      const passed = scorePercentage >= 70;
      const attemptedEarnedXp = Number(payload.earned_xp || 0);

      let alreadyCompleted = false;
      try {
        alreadyCompleted = await this.model.hasUserAttempt({ userId, quizId: quizData.id });
      } catch {
        alreadyCompleted = false;
      }

      if (alreadyCompleted) {
        return {
          ok: true,
          data: {
            success: true,
            already_completed: true,
            passed,
            score_percentage: scorePercentage,
            earned_xp: 0,
            practice_earned_xp: passed ? attemptedEarnedXp : 0,
          },
        };
      }

      try {
        await this.model.createAttempt({
          userId,
          quizId: quizData.id,
          scorePercentage: payload.score_percentage,
          totalCorrect: payload.total_correct,
          totalQuestions: payload.total_questions,
          earnedXp: payload.earned_xp,
        });
        return { ok: true, data: { success: true, already_completed: false } };
      } catch {
        // Treat races/uniques as idempotent completion.
        return {
          ok: true,
          data: {
            success: true,
            already_completed: true,
            passed,
            score_percentage: scorePercentage,
            earned_xp: 0,
            practice_earned_xp: passed ? attemptedEarnedXp : 0,
          },
        };
      }
    } else {
      // CODE QUIZ
      const code = payload.code;
      if (typeof code !== "string" || !code.trim()) {
        return { ok: false, status: 400, message: "code is required" };
      }

      let alreadyCompleted = false;
      if (!isAdmin) {
        try {
          alreadyCompleted = await this.model.hasUserAttempt({ userId, quizId: quizData.id });
        } catch {
          alreadyCompleted = false;
        }
      }

      const normalizeTestCase = (tc) => {
        const isHidden = Boolean(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden);
        const modeRaw = tc?.mode ?? "stdin";
        const mode = String(modeRaw || "stdin").trim().toLowerCase() === "function" ? "function" : "stdin";
        const inputRaw = tc?.input ?? tc?.stdin ?? "";
        const expectedRaw = tc?.expected ?? tc?.expected_output ?? tc?.expectedOutput ?? "";
        const functionName = tc?.functionName ?? tc?.function_name ?? null;
        return {
          mode,
          functionName: functionName ? String(functionName) : null,
          input: mode === "function" ? toJsonIfNeeded(inputRaw) : (inputRaw === null || inputRaw === undefined ? "" : String(inputRaw)),
          expected: mode === "function" ? toJsonIfNeeded(expectedRaw) : (expectedRaw === null || expectedRaw === undefined ? "" : String(expectedRaw)),
          is_hidden: isHidden,
        };
      };

      const effectiveTestCases = Array.isArray(quizData.test_cases) && quizData.test_cases.length > 0
        ? quizData.test_cases.map(normalizeTestCase)
        : [];

      if (effectiveTestCases.length === 0) {
        return { ok: false, status: 400, message: "Quiz has no test cases configured" };
      }

      const executionCode = code;

      try {
        let execution;
        try {
          const { data } = await axios.post(
            `${TERMINAL_API_BASE_URL}/exam/run`,
            {
              language,
              code: executionCode,
              testCases: effectiveTestCases,
            },
            {
              headers: {
                "x-internal-key": process.env.INTERNAL_KEY
              }
            }
          );
          execution = data;
        } catch (err) {
          execution = buildExecutionFromRunnerError(err, effectiveTestCases);
        }

        const totalTests = execution.total;
        const passedTests = execution.passed;
        const scorePercentage = execution.score;
        const passed = scorePercentage >= 70;

        const sanitizedResults = sanitizeExecutionResults({
          testCases: effectiveTestCases,
          results: execution.results
        });

        const baseExp = Number(quizData.exp_total || 0);
        let earnedXp = Math.round(baseExp * (scorePercentage / 100));
        if (scorePercentage === 100) {
          earnedXp += Math.round(baseExp * 0.1); // +10% bonus
        }

        const responsePayload = {
          success: true,
          passed,
          score_percentage: scorePercentage,
          passed_tests: passedTests,
          total_tests: totalTests,
          earned_xp: passed ? earnedXp : 0,
          results: sanitizedResults,
        };

        if (isAdmin) {
          responsePayload.preview = true;
          return { ok: true, data: responsePayload };
        }

        if (alreadyCompleted) {
          return {
            ok: true,
            data: {
              ...responsePayload,
              already_completed: true,
              earned_xp: 0,
              practice_earned_xp: passed ? earnedXp : 0,
            },
          };
        }

        if (!passed) {
          // Return results to UI but do not persist as 'completed'
          return { ok: true, data: responsePayload };
        }

        // If passed, persist to DB
        try {
          await this.model.createAttempt({
            userId,
            quizId: quizData.id,
            scorePercentage,
            totalCorrect: passedTests,
            totalQuestions: totalTests,
            earnedXp: earnedXp,
          });
          responsePayload.earned_xp = earnedXp;
          responsePayload.already_completed = false;
          return { ok: true, data: responsePayload };
        } catch (err) {
          // Treat races/uniques as idempotent completion.
          return {
            ok: true,
            data: {
              ...responsePayload,
              already_completed: true,
              earned_xp: 0,
              practice_earned_xp: passed ? earnedXp : 0,
            },
          };
        }
      } catch {
        return { ok: false, status: 500, message: "Failed to run tests" };
      }
    }
  }

  async validateQuiz({ userId, tokenRole, language, quizId, payload }) {
    if (!userId) {
      return { ok: false, status: 401, message: "Unauthorized" };
    }

    const stageNumber = Number(quizId);
    if (!Number.isFinite(stageNumber)) {
      return { ok: false, status: 400, message: "Invalid quizId" };
    }

    let languageData;
    try {
      languageData = await this.model.getLanguageBySlug(language);
    } catch {
      return { ok: false, status: 404, message: "Language not found" };
    }

    let quizData;
    try {
      quizData = await this.model.getQuizByLanguageAndStage({
        programmingLanguageId: languageData.id,
        stageNumber,
        select: "*",
      });
    } catch {
      return { ok: false, status: 404, message: "Quiz not found" };
    }

    const isAdmin = await this.resolveIsAdmin(userId, tokenRole);
    let quizType = quizData.quiz_type;
    if (!quizType) {
      quizType = stageNumber >= 2 && stageNumber <= 4 ? "code" : "mcq";
    }
    quizType = String(quizType).toLowerCase() === "code" ? "code" : "mcq";

    if (quizType !== "code") {
      return { ok: true, data: { success: true, preview: true } };
    }

    const code = payload.code;
    if (typeof code !== "string" || !code.trim()) {
      return { ok: false, status: 400, message: "code is required" };
    }

    const normalizeTestCase = (tc) => {
      const isHidden = Boolean(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden);
      const modeRaw = tc?.mode ?? "stdin";
      const mode = String(modeRaw || "stdin").trim().toLowerCase() === "function" ? "function" : "stdin";
      const inputRaw = tc?.input ?? tc?.stdin ?? "";
      const expectedRaw = tc?.expected ?? tc?.expected_output ?? tc?.expectedOutput ?? "";
      const functionName = tc?.functionName ?? tc?.function_name ?? null;
      return {
        mode,
        functionName: functionName ? String(functionName) : null,
        input: mode === "function" ? toJsonIfNeeded(inputRaw) : (inputRaw === null || inputRaw === undefined ? "" : String(inputRaw)),
        expected: mode === "function" ? toJsonIfNeeded(expectedRaw) : (expectedRaw === null || expectedRaw === undefined ? "" : String(expectedRaw)),
        is_hidden: isHidden,
      };
    };

    const effectiveTestCases = Array.isArray(quizData.test_cases) && quizData.test_cases.length > 0
      ? quizData.test_cases.map(normalizeTestCase)
      : [];

    if (effectiveTestCases.length === 0) {
      return { ok: false, status: 400, message: "Quiz has no test cases configured" };
    }

    const executionCode = code;

    try {
      let execution;
      try {
        const { data } = await axios.post(
          `${TERMINAL_API_BASE_URL}/exam/run`,
          {
            language,
            code: executionCode,
            testCases: effectiveTestCases,
          },
          {
            headers: {
              "x-internal-key": process.env.INTERNAL_KEY
            }
          }
        );
        execution = data;
      } catch (err) {
        execution = buildExecutionFromRunnerError(err, effectiveTestCases);
      }

      const totalTests = execution.total;
      const passedTests = execution.passed;
      const scorePercentage = execution.score;
      const passed = scorePercentage >= 70;

      const sanitizedResults = sanitizeExecutionResults({
        testCases: effectiveTestCases,
        results: execution.results
      });

      return {
        ok: true,
        data: {
          success: true,
          passed,
          score_percentage: scorePercentage,
          passed_tests: passedTests,
          total_tests: totalTests,
          earned_xp: 0,
          results: sanitizedResults,
          preview: true,
          visible_only: false,
          admin: Boolean(isAdmin),
        },
      };
    } catch {
      return { ok: false, status: 500, message: "Failed to run tests" };
    }
  }

  async listAttempts({ userId, languageSlug, limit = 50 }) {
    if (!userId) {
      return { ok: false, status: 401, message: "Unauthorized" };
    }

    const limitRaw = Number(limit);
    const safeLimit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 200)
      : 50;

    try {
      const rows = await this.model.listUserAttempts({
        userId,
        limit: safeLimit,
      });

      const attemptsAll = (rows || []).map((row) => {
        const langSlug = row?.quizzes?.programming_languages?.slug || "unknown";
        const score = Number(row?.score_percentage || 0);
        return {
          id: row.id,
          quizId: row.quiz_id,
          language: langSlug,
          quizTitle: row?.quizzes?.quiz_title || row?.quizzes?.route || "Quiz",
          scorePercentage: score,
          totalCorrect: Number(row?.total_correct || 0),
          totalQuestions: Number(row?.total_questions || 0),
          earnedXp: Number(row?.earned_xp || 0),
          isPassed: score >= 70,
          submittedAt: row?.completed_at || null,
        };
      });

      const normalizedFilter = typeof languageSlug === "string" && languageSlug
        ? String(languageSlug).toLowerCase()
        : null;

      const attempts = normalizedFilter
        ? attemptsAll.filter((a) => String(a.language || "").toLowerCase() === normalizedFilter)
        : attemptsAll;

      return { ok: true, data: attempts };
    } catch (err) {
      console.error("Failed to list quiz attempts", err);
      return {
        ok: false,
        status: 500,
        message: err?.message || "Failed to fetch quiz attempts",
      };
    }
  }
}

export default QuizService;
