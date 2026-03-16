import QuizModel from "../models/quiz.js";
import axios from "axios";
import sectionsToMarkdown from "../utilities/sectionsToMarkdown.js";

const TERMINAL_API_BASE_URL = process.env.TERMINAL_API_BASE_URL || "https://terminal.codemania.fun";

function needsRunner(language, code) {
  const s = String(code || "");
  if (!s.trim()) return true;

  if (language === "python") return !s.includes("sys.stdin");
  if (language === "javascript") return !s.includes("readFileSync(0") && !s.includes("process.stdin");
  if (language === "cpp") return !s.includes("main(");
  return true;
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
      quiz_description: quizData.quiz_description || "",
    };

    if (quizType === "mcq") {
      responseData.questions = questions;
    } else {
      let mockPrompt = {
        "sections": [
          { "type": "heading", "level": 2, "content": "🛡️ The Guardian's Test" },
          { "type": "paragraph", "content": "You must write a function to calculate the sum of two numbers. This is essential to calculate the total power of our warriors." },
          { "type": "list", "style": "bullet", "items": ["Take two integer parameters.", "Return their sum.", "Do not print anything else to the console."] }
        ]
      };
      
      let mockStartingCode = {
        python: 'def calculate_sum(a, b):\n    # Write your code here\n    pass\n\n# Terminal runner helper\nimport sys\ninput_data = sys.stdin.read().strip().split()\nif len(input_data) >= 2:\n    print(calculate_sum(int(input_data[0]), int(input_data[1])))',
        javascript: 'function calculateSum(a, b) {\n    // Write your code here\n}\n\n// Terminal runner helper\nconst fs = require("fs");\ntry {\n  const inputData = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);\n  if (inputData.length >= 2) {\n      console.log(calculateSum(Number(inputData[0]), Number(inputData[1])));\n  }\n} catch(e) {}',
        cpp: '#include <iostream>\nusing namespace std;\n\nint calculateSum(int a, int b) {\n    // Write your code here\n}\n\n// Terminal runner helper\nint main() {\n    int a, b;\n    if (cin >> a >> b) cout << calculateSum(a, b);\n    return 0;\n}'
      }[language] || '// Write your code here';

      let mockTestCases = [
        {"input": "2 3", "expected": "5", "is_hidden": false},
        {"input": "-1 1", "expected": "0", "is_hidden": true},
        {"input": "10 20", "expected": "30", "is_hidden": true}
      ];

      const parseMaybeJsonPrompt = (value) => {
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
      };

      const legacyPromptMarkdown = sectionsToMarkdown(
        parseMaybeJsonPrompt(quizData.code_prompt) || mockPrompt
      );
      if (!responseData.quiz_description) {
        responseData.quiz_description = legacyPromptMarkdown;
      }

      const effectiveStarting = quizData.starting_code || mockStartingCode;
      responseData.starting_code = appendQuizRunner({
        language,
        stageNumber,
        startingCode: effectiveStarting,
      });
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
      let testCases = realTestCases.length > 0 ? realTestCases : mockTestCases;
      
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

      try {
        await this.model.createAttempt({
          userId,
          quizId: quizData.id,
          scorePercentage: payload.score_percentage,
          totalCorrect: payload.total_correct,
          totalQuestions: payload.total_questions,
          earnedXp: payload.earned_xp,
        });
        return { ok: true, data: { success: true } };
      } catch {
        return { ok: false, status: 400, message: "Quiz already completed" };
      }
    } else {
      // CODE QUIZ
      const code = payload.code;
      if (typeof code !== "string" || !code.trim()) {
        return { ok: false, status: 400, message: "code is required" };
      }

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

      const effectiveTestCases = Array.isArray(quizData.test_cases) && quizData.test_cases.length > 0
        ? quizData.test_cases.map(normalizeTestCase)
        : [
            { input: "2 3", expected: "5", is_hidden: false },
            { input: "-1 1", expected: "0", is_hidden: true },
            { input: "10 20", expected: "30", is_hidden: true },
          ];

      try {
        const { data: execution } = await axios.post(
          `${TERMINAL_API_BASE_URL}/exam/run`,
          {
            language,
            code,
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
        // "Accepted" means all tests passed, but we still record partial scores.
        const passed = scorePercentage === 100;

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
          earned_xp: earnedXp,
          results: execution.results,
        };

        if (isAdmin) {
          responsePayload.preview = true;
          responsePayload.earned_xp = 0;
          return { ok: true, data: responsePayload };
        }

        // Persist attempt (even if not accepted) so the quiz is "done" on submit.
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
          return { ok: true, data: responsePayload };
        } catch (err) {
          return { ok: false, status: 400, message: "Quiz already completed" };
        }
      } catch (err) {
        return { ok: false, status: 500, message: "Failed to run tests" };
      }
    }
  }

  async runQuiz({ userId, tokenRole, language, quizId, payload }) {
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

    let quizType = quizData.quiz_type;
    if (!quizType) {
      quizType = stageNumber >= 2 && stageNumber <= 4 ? "code" : "mcq";
    }
    quizType = String(quizType).toLowerCase() === "code" ? "code" : "mcq";

    if (quizType !== "code") {
      return { ok: false, status: 400, message: "Only code quizzes can be run" };
    }

    const code = payload.code;
    if (typeof code !== "string" || !code.trim()) {
      return { ok: false, status: 400, message: "code is required" };
    }

    const coerceBool = (value) => {
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
    };

    const normalizeTestCase = (tc) => {
      const isHidden = coerceBool(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden);
      const input = tc?.input ?? tc?.stdin ?? "";
      const expected = tc?.expected ?? tc?.expected_output ?? tc?.expectedOutput ?? "";
      return {
        input: input === null || input === undefined ? "" : String(input),
        expected: expected === null || expected === undefined ? "" : String(expected),
        is_hidden: isHidden,
      };
    };

    const effectiveTestCasesAll = Array.isArray(quizData.test_cases) && quizData.test_cases.length > 0
      ? quizData.test_cases.map(normalizeTestCase)
      : [
          { input: "2 3", expected: "5", is_hidden: false },
          { input: "-1 1", expected: "0", is_hidden: true },
          { input: "10 20", expected: "30", is_hidden: true },
        ];

    const visibleTestCases = effectiveTestCasesAll.filter((tc) => !tc.is_hidden);

    try {
      const { data: execution } = await axios.post(
        `${TERMINAL_API_BASE_URL}/exam/run`,
        {
          language,
          code,
          testCases: visibleTestCases,
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_KEY,
          },
        }
      );

      const totalTests = execution.total;
      const passedTests = execution.passed;
      const scorePercentage = execution.score;

      // For a "Run" we require visible tests all pass.
      const passed = scorePercentage === 100;

      return {
        ok: true,
        data: {
          success: true,
          mode: "run",
          passed,
          score_percentage: scorePercentage,
          passed_tests: passedTests,
          total_tests: totalTests,
          earned_xp: 0,
          results: execution.results,
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
