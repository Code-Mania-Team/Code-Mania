import MetricsService from "../../services/metricsService.js";

class MetricsController {
  constructor(service = new MetricsService()) {
    this.service = service;
  }

  async getAdminSummary(req, res) {
    try {
      const data = await this.service.getAdminSummary();
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error building admin summary metrics:", err);
      return res.status(500).json({ success: false, message: err?.message || "Failed to build metrics" });
    }
  }

  async getQuizAttempts(req, res) {
    try {
      const data = await this.service.getQuizAttemptsMetrics();
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error fetching quiz attempts metrics:", err);
      return res.status(500).json({ success: false, message: err?.message || "Failed to fetch quiz metrics" });
    }
  }

  async getQuizAttemptsByUser(req, res) {
    try {
      const data = await this.service.getQuizAttemptsByUser();
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error fetching per-user quiz metrics:", err);
      return res.status(500).json({ success: false, message: err?.message || "Failed to fetch per-user quiz metrics" });
    }
  }

  async getQuizAttemptsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const data = await this.service.getQuizAttemptsByUserId(userId);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error fetching user quiz attempts:", err);
      return res.status(500).json({ success: false, message: err?.message || "Failed to fetch user quiz attempts" });
    }
  }

  async getExamAttempts(req, res) {
    try {
      const data = await this.service.getExamAttemptsMetrics();
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error fetching exam attempts metrics:", err);
      return res.status(500).json({ success: false, message: err?.message || "Failed to fetch exam metrics" });
    }
  }

  async getExamAttemptsByUser(req, res) {
    try {
      const data = await this.service.getExamAttemptsByUser();
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error fetching per-user exam metrics:", err);
      return res.status(500).json({ success: false, message: err?.message || "Failed to fetch per-user exam metrics" });
    }
  }

  async getExamAttemptsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const data = await this.service.getExamAttemptsByUserId(userId);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error fetching user exam attempts:", err);
      return res.status(500).json({ success: false, message: err?.message || "Failed to fetch user exam attempts" });
    }
  }
}

export default MetricsController;