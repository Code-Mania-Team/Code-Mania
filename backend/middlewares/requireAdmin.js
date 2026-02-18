export default function requireAdmin(req, res, next) {
    // Check if user exists and has admin role
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: admin access required',
        });
    }

    next();
}

export { requireAdmin };
