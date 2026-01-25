import jwt from "jsonwebtoken";

export default function authentication(req, res, next) {
    const token = req.cookies.accessToken;

    

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
        next();
    });
}

export { authentication };