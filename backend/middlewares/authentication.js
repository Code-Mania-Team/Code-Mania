import jwt from 'jsonwebtoken';

export default function authentication(req, res, next) {
    const token = req.cookies?.token; // only read from cookies

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthenticated user',
        });
    }

    jwt.verify(token, process.env.API_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }

        // Attach user info to res.locals for downstream handlers
        res.locals.username = decoded?.username || null;
        res.locals.user_id = decoded?.user_id;
        res.locals.authenticated = true;

        next();
    });
}
export { authentication };