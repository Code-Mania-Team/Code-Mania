import AdminQuizService from "../../services/adminQuizService.js";

class AdminQuizController {
  constructor(service = new AdminQuizService()) {
    this.service = service;
  }

  async list(req, res) {
    try {
      const language = typeof req.query.language === "string" ? req.query.language : undefined;
      const result = await this.service.listQuizzes({ languageSlug: language });
      if (!result.ok) {
        return res.status(result.status || 500).json({ success: false, message: result.message });
      }
      return res.status(200).json({ success: true, data: result.data || [] });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to list quizzes" });
    }
  }

  async get(req, res) {
    try {
      const quizId = Number(req.params.quizId);
      if (!Number.isFinite(quizId)) {
        return res.status(400).json({ success: false, message: "Invalid quizId" });
      }

      const result = await this.service.getQuiz(quizId);
      if (!result.ok) {
        return res.status(result.status || 500).json({ success: false, message: result.message });
      }
      return res.status(200).json({ success: true, data: result.data });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch quiz" });
    }
  }

  async update(req, res) {
    try {
      const quizId = Number(req.params.quizId);
      if (!Number.isFinite(quizId)) {
        return res.status(400).json({ success: false, message: "Invalid quizId" });
      }

      const result = await this.service.updateQuiz(quizId, req.body || {});
      if (!result.ok) {
        return res.status(result.status || 500).json({ success: false, message: result.message });
      }
      return res.status(200).json({ success: true, data: result.data });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to update quiz" });
    }
  }
}

export default AdminQuizController;
