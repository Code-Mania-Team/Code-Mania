import QuizModel from "../models/quiz.js";
import axios from "axios";

const TERMINAL_API_BASE_URL = process.env.TERMINAL_API_BASE_URL || "https://terminal.codemania.fun";

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
    let quizType = quizData.quiz_type || "mcq";
    if (stageNumber >= 2 && stageNumber <= 4) {
      quizType = "code";
    }

    const responseData = {
      quiz_title: quizData.quiz_title,
      quiz_type: quizType,
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

      responseData.code_prompt = quizData.code_prompt || mockPrompt;
      responseData.starting_code = quizData.starting_code || mockStartingCode;
      responseData.exp_total = quizData.exp_total || 500;
      
      let realTestCases = Array.isArray(quizData.test_cases) ? quizData.test_cases : [];
      let testCases = realTestCases.length > 0 ? realTestCases : mockTestCases;
      
      responseData.meta = {
        test_case_count: testCases.length,
      };
      
      responseData.test_cases = testCases.map(tc => ({
        input: tc.is_hidden ? "Hidden test case" : tc.input,
        expected: tc.is_hidden ? "Hidden" : tc.expected,
        is_hidden: tc.is_hidden
      }));
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
    let quizType = quizData.quiz_type || "mcq";
    if (stageNumber >= 2 && stageNumber <= 4) {
      quizType = "code";
    }

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

      try {
        const { data: execution } = await axios.post(
          `${TERMINAL_API_BASE_URL}/exam/run`,
          {
            language,
            code,
            testCases: (Array.isArray(quizData.test_cases) && quizData.test_cases.length > 0) ? quizData.test_cases : [
              {"input": "2 3", "expected": "5", "is_hidden": false},
              {"input": "-1 1", "expected": "0", "is_hidden": true},
              {"input": "10 20", "expected": "30", "is_hidden": true}
            ],
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
          results: execution.results,
        };

        if (isAdmin) {
          responsePayload.preview = true;
          return { ok: true, data: responsePayload };
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
          return { ok: true, data: responsePayload };
        } catch (err) {
          return { ok: false, status: 400, message: "Quiz already completed" };
        }
      } catch (err) {
        return { ok: false, status: 500, message: "Failed to run tests" };
      }
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
