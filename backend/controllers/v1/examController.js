import ExamService from "../../services/examService.js";

class ExamController {
  constructor() {
    this.examService = new ExamService();
  }

  async listProblems(req, res) {
    try {
      const language = req.query.language ? String(req.query.language) : "";
      const languageSlug = language ? language.toLowerCase() : undefined;

      const problems = await this.examService.listProblems({ languageSlug });
      return res.status(200).json({ success: true, data: problems });
    } catch (err) {
      console.error("listProblems error:", err);
      return res.status(500).json({ success: false, message: "Failed to list exam problems" });
    }
  }

  async getProblem(req, res) {
    try {
      const problemId = Number(req.params.problemId);
      if (!Number.isFinite(problemId)) {
        return res.status(400).json({ success: false, message: "Invalid problemId" });
      }

      const safe = await this.examService.getProblemSafe(problemId);
      if (!safe) {
        return res.status(404).json({ success: false, message: "Problem not found" });
      }

      return res.status(200).json({ success: true, data: safe });
    } catch (err) {
      console.error("getProblem error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch exam problem" });
    }
  }

  async startAttempt(req, res) {
    try {
      const userId = res.locals.user_id;
      if (!userId)
        return res.status(401).json({ success: false, message: "Unauthorized" });

      const language = req.body?.language;
      if (!language)
        return res.status(400).json({ success: false, message: "language is required" });

      const result = await this.examService.startAttempt({
        userId,
        languageSlug: language.toLowerCase()
      });

      if (!result.ok)
        return res.status(result.status).json({
          success: false,
          message: result.message
        });

      return res.status(201).json({ success: true, data: result.data });

    } catch (err) {
      console.error("startAttempt error:", err);
      return res.status(500).json({ success: false, message: "Failed to start attempt" });
    }
  }
  async submitAttempt(req, res) {
    try {
      const userId = res.locals.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const attemptId = Number(req.params.attemptId);
      if (!Number.isFinite(attemptId)) {
        return res.status(400).json({ success: false, message: "Invalid attemptId" });
      }

      const code = req.body?.code;
      if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ success: false, message: "code is required" });
      }

      const result = await this.examService.submitAttempt({ userId, attemptId, code });
      if (!result.ok) {
        return res
          .status(result.status || 500)
          .json({ success: false, message: result.message, ...(result.data || {}) });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      console.error("submitAttempt error:", err);
      return res.status(500).json({ success: false, message: "Failed to submit exam attempt" });
    }
  }

  async listAttempts(req, res) {
    try {
      const userId = res.locals.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const language = req.query.language ? String(req.query.language) : "";
      const languageSlug = language ? language.toLowerCase() : undefined;
      const problemIdRaw = req.query.problemId;
      const problemId = problemIdRaw ? Number(problemIdRaw) : undefined;
      const limitRaw = req.query.limit ? Number(req.query.limit) : 50;
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

      const attempts = await this.examService.listAttempts({
        userId,
        languageSlug,
        problemId,
        limit,
      });

      return res.status(200).json({ success: true, data: attempts });
    } catch (err) {
      console.error("listAttempts error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch attempts" });
    }
  }

  async status(req, res) {
    try {
      const userId = res.locals.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const language = req.query.language ? String(req.query.language) : "";
      const languageSlug = language ? language.toLowerCase() : undefined;

      const status = await this.examService.status({ userId, languageSlug });
      return res.status(200).json({ success: true, data: status });
    } catch (err) {
      console.error("exam status error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch exam status" });
    }
  }
}

export default ExamController;