import jwt from "jsonwebtoken";

export default function authentication(req, res, next) {
    const token =
        req.cookies.accessToken ||
        req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthenticated user",
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        res.locals.user_id = decoded.user_id;
        res.locals.username = decoded.username;
        res.locals.role = decoded.role;
        next();
    });
}


export { authentication };
