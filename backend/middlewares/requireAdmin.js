// middlewares/requireAdmin.js
import AccountService from "../services/accountService.js";

const userService = new AccountService();

async function requireAdmin(req, res, next) {
  try {
    const tokenRole = req.user?.role || res.locals?.role;

    // If JWT already contains admin role → skip DB
    if (tokenRole === "admin") {
      return next();
    }

    const userId = req.user?.user_id || res.locals?.user_id;

    await userService.ensureAdmin(userId);

    return next();

  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: admin access required",
    });
  }
}

export default requireAdmin;