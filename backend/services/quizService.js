import QuizModel from "../models/quiz.js";
import axios from "axios";

const TERMINAL_API_BASE_URL = process.env.TERMINAL_API_BASE_URL || "https://terminal.codemania.fun";

function needsRunner(language, code) {
  const s = String(code || "");
  if (!s.trim()) return true;

  if (language === "python") return !s.includes("sys.stdin");
  if (language === "javascript") return !s.includes("readFileSync(0") && !s.includes("process.stdin");
  if (language === "cpp") return !s.includes("main(");
  return true;
}

function toJsonIfNeeded(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function appendQuizRunner({ language, stageNumber, startingCode }) {
  const base = String(startingCode || "").trimEnd();
  if (!needsRunner(language, base)) return base;

  const stage = Number(stageNumber);

  if (language === "python") {
    if (stage === 2) {
      return `${base}\n\n# Runner helper\nimport sys\nimport ast\n\n_raw = sys.stdin.read().strip()\nif _raw:\n    try:\n        _args = ast.literal_eval(_raw)\n    except Exception:\n        _parts = _raw.replace(',', ' ').split()\n        _args = tuple(int(x) for x in _parts[:2])\n\n    if isinstance(_args, (tuple, list)):\n        print(calculate_sum(*_args))\n    else:\n        print(calculate_sum(_args, 0))\n`;
    }

    if (stage === 3) {
      return `${base}\n\n# Runner helper\nimport sys\nimport ast\n\n_raw = sys.stdin.read().strip()\nif _raw:\n    try:\n        _numbers = ast.literal_eval(_raw)\n    except Exception:\n        _numbers = [int(x) for x in _raw.replace(',', ' ').split() if x]\n\n    print(find_max(list(_numbers)))\n`;
    }

    if (stage === 4) {
      return `${base}\n\n# Runner helper\nimport sys\nimport ast\n\n_raw = sys.stdin.read().strip()\nif _raw:\n    try:\n        _text = ast.literal_eval(_raw)\n    except Exception:\n        _text = _raw\n\n    print(is_palindrome(str(_text)))\n`;
    }
  }

  if (language === "javascript") {
    if (stage === 2) {
      return `${base}\n\n// Runner helper\nconst fs = require("fs");\nconst raw = (fs.readFileSync(0, "utf-8") || "").trim();\nif (raw) {\n  const parts = raw.split(",").map(s => s.trim()).filter(Boolean);\n  const a = Number(parts[0]);\n  const b = Number(parts[1]);\n  console.log(String(calculateSum(a, b)));\n}\n`;
    }

    if (stage === 3) {
      return `${base}\n\n// Runner helper\nconst fs = require("fs");\nconst raw = (fs.readFileSync(0, "utf-8") || "").trim();\nif (raw) {\n  const numbers = JSON.parse(raw);\n  console.log(String(findMax(numbers)));\n}\n`;
    }

    if (stage === 4) {
      return `${base}\n\n// Runner helper\nconst fs = require("fs");\nconst raw = (fs.readFileSync(0, "utf-8") || "").trim();\nif (raw) {\n  const text = JSON.parse(raw);\n  console.log(String(isPalindrome(String(text))));\n}\n`;
    }
  }

  if (language === "cpp") {
    if (stage === 2) {
      return `${base}\n\n#include <iostream>\n\nint main() {\n    int a, b;\n    if (std::cin >> a >> b) {\n        std::cout << calculateSum(a, b);\n    }\n    return 0;\n}\n`;
    }

    if (stage === 3) {
      return `${base}\n\n#include <iostream>\n#include <vector>\n\nint main() {\n    int n;\n    if (!(std::cin >> n)) return 0;\n    std::vector<int> numbers;\n    numbers.reserve(n);\n    for (int i = 0; i < n; i++) {\n        int x;\n        if (!(std::cin >> x)) break;\n        numbers.push_back(x);\n    }\n    std::cout << findMax(numbers);\n    return 0;\n}\n`;
    }

    if (stage === 4) {
      return `${base}\n\n#include <iostream>\n#include <string>\n\nstatic std::string stripQuotes(const std::string& s) {\n    if (s.size() >= 2 && s.front() == '"' && s.back() == '"') {\n        return s.substr(1, s.size() - 2);\n    }\n    return s;\n}\n\nint main() {\n    std::string text;\n    std::getline(std::cin, text);\n    if (text.empty()) return 0;\n    text = stripQuotes(text);\n    std::cout << (isPalindrome(text) ? 1 : 0);\n    return 0;\n}\n`;
    }
  }

  return base;
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

      const hasFunctionMode = effectiveTestCases.some((tc) => tc && tc.mode === "function");

      // JavaScript stdin requires process/fs, which are blocked by sanitizer.
      // For JS quizzes, prefer function mode and do not append a runner.
      const executionCode =
        language === "javascript" || hasFunctionMode
          ? code
          : appendQuizRunner({ language, stageNumber, startingCode: code });

      try {
        const { data: execution } = await axios.post(
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
      } catch (err) {
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

    const hasFunctionMode = effectiveTestCases.some((tc) => tc && tc.mode === "function");
    const executionCode =
      language === "javascript" || hasFunctionMode
        ? code
        : appendQuizRunner({ language, stageNumber, startingCode: code });

    try {
      const { data: execution } = await axios.post(
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
    } catch (err) {
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
