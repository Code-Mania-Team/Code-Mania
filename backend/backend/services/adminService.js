import User from "../models/user.js";

class AdminService {
  constructor(userModel = new User()) {
    this.userModel = userModel;
  }

  async listUsers() {
    return this.userModel.getAllForAdmin();
  }
}

export default AdminService;
