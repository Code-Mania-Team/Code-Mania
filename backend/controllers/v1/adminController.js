import AdminService from "../../services/adminService.js";

class AdminController {
  constructor() {
    this.adminService = new AdminService();
  }

  async getDashboard(req, res) {
    try {
      const users = await this.adminService.getUserAnalytics();
      const quizzes = await this.adminService.getQuizAnalytics();
      res.status(200).json({
        data: users,
        quizzes,
      });
    } catch (error) {
      console.error(error);
    }
  }
}

export default AdminController;
