import AdminService from "../../services/adminService.js";

class AdminController {
  constructor(service = new AdminService()) {
    this.service = service;
  }

  async listUsers(req, res) {
    try {
      const data = await this.service.listUsers();
      return res.json({ success: true, data });
    } catch (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ success: false, message: err?.message || "Failed to fetch users" });
    }
  }
}

export default AdminController;
