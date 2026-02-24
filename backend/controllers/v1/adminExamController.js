import AdminExamService from "../../services/adminExamService.js";

class AdminExamController {
  constructor() {
    this.adminExamService = new AdminExamService();
  }

  async updateProblem(req, res) {
    try {
      const problemId = Number(req.params.problemId);
      if (!Number.isFinite(problemId)) {
        return res.status(400).json({ success: false, message: "Invalid problemId" });
      }

      const result = await this.adminExamService.updateProblem(problemId, req.body || {});
      if (!result.ok) {
        return res.status(result.status || 500).json({ success: false, message: result.message });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      console.error("admin updateProblem error:", err);
      return res.status(500).json({ success: false, message: "Failed to update exam problem" });
    }
  }
}

export default AdminExamController;
