export default function requireAdmin(req, res, next) {
  const role = res.locals.role;
  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: admin access required",
    });
  }
  next();
}
export { requireAdmin };
