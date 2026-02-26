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
      console.error("getQuizById error:", err);
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
      console.error("completeQuiz error:", err);
      return res.status(500).json({ message: "Failed to complete quiz" });
    }
  }
}

export default QuizController;
