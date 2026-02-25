import AdminService from "../../services/adminService.js";

class AdminController {
  constructor() {
    this.adminService = new AdminService();
  }

  async getDashboard(req, res) {
    try {
      const users = await this.adminService.getUserAnalytics();
      console.log(users);
    } catch (error) {
      console.error(error);
    }
  }
}

export default AdminController;
