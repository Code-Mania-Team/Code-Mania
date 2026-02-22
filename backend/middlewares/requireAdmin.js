export default function requireAdmin(req, res, next) {
    // Accept role from either req.user (passport-style) or res.locals (jwt auth middleware)
    const role = req.user?.role || res.locals?.role;

    if (role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: admin access required',
        });
    }

    // Normalize req.user so downstream code can rely on it.
    if (!req.user) {
        req.user = {
            user_id: res.locals?.user_id,
            username: res.locals?.username,
            role,
        };
    }

    next();
}

export { requireAdmin };
