import QuizService from "../../services/quizService.js";

class QuizController {
  constructor(service = new QuizService()) {
    this.service = service;
  }

  async getQuizById(req, res) {
    const { language, quizId } = req.params;

    try {
      res.set("Cache-Control", "no-store");
      const result = await this.service.getQuizByLanguageAndStage(language, quizId);

      if (!result.ok) {
        return res.status(result.status || 500).json({
          message: result.message || "Failed to fetch quiz",
          questions: [],
        });
      }

      return res.json(result.data);
    } catch (err) {
      return res.status(500).json({
        message: "Failed to fetch quiz",
        questions: [],
      });
    }
  }

  async completeQuiz(req, res) {
    const { language, quizId } = req.params;
    const userId = res.locals.user_id;
    const tokenRole = res.locals.role;

    try {
      const result = await this.service.completeQuiz({
        userId,
        tokenRole,
        language,
        quizId,
        payload: req.body || {},
      });

      if (!result.ok) {
        return res.status(result.status || 500).json({ message: result.message || "Failed to complete quiz" });
      }

      return res.json(result.data);
    } catch (err) {
      return res.status(500).json({ message: "Failed to complete quiz" });
    }
  }

  async runQuiz(req, res) {
    const { language, quizId } = req.params;
    const userId = res.locals.user_id;
    const tokenRole = res.locals.role;

    try {
      const result = await this.service.runQuiz({
        userId,
        tokenRole,
        language,
        quizId,
        payload: req.body || {},
      });

      if (!result.ok) {
        return res.status(result.status || 500).json({ message: result.message || "Failed to run quiz" });
      }

      return res.json(result.data);
    } catch (err) {
      return res.status(500).json({ message: "Failed to run quiz" });
    }
  }

  async listAttempts(req, res) {
    const userId = res.locals.user_id;

    try {
      const limit = req.query.limit;
      const language = req.query.language;
      const result = await this.service.listAttempts({
        userId,
        limit,
        languageSlug: typeof language === "string" ? language : undefined,
      });

      if (!result.ok) {
        return res.status(result.status || 500).json({
          success: false,
          message: result.message || "Failed to fetch quiz attempts",
          data: [],
        });
      }

      return res.status(200).json({ success: true, data: result.data || [] });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err?.message || "Failed to fetch quiz attempts",
        data: [],
      });
    }
  }
}

export default QuizController;
