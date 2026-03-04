import GAService from "../../services/gaService.js";

class AdminController {
  constructor() {
    this.gaService = new GAService();
  }

  async activeUsers(req, res) {
    try {
      const activeUsers = await this.gaService.getActiveUsers();
      const trafficLogs7Days = await this.gaService.getTraffic();
      return res.status(200).json({ activeUsers, trafficLogs7Days });
    } catch (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({
        success: false,
        message: err?.message || "Failed to fetch users",
      });
    }
  }

  async trafficLogs7Days(req, res) {
    try {
      const trafficLogs7Days = await this.gaService.getTraffic();
      return res.status(200).json({ trafficLogs7Days });
    } catch (err) {
      console.error("Error fetching logs:", err);
      return res.status(500).json({
        success: false,
        message: err?.message || "Failed to fetch logs",
      });
    }
  }
}

export default AdminController;
