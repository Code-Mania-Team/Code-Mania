import jwt from "jsonwebtoken";
import UserToken from "../models/userToken.js";

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

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        // Check if user still has valid refresh token in database
        try {
            const userToken = new UserToken();
            const tokenRecord = await userToken.findByUserId(decoded.user_id);
            
            // If no token record or token is null (invalidated), deny access
            if (!tokenRecord || !tokenRecord.token) {
                return res.status(401).json({
                    success: false,
                    message: "Session expired. Please login again.",
                });
            }
        } catch (dbError) {
            return res.status(500).json({
                success: false,
                message: "Authentication error",
            });
        }

        // ✅ Only assign user_id if exists
        if (decoded.user_id) {
            res.locals.user_id = decoded.user_id;
        }

        // ✅ Assign email for onboarding users
        if (decoded.email) {
            res.locals.email = decoded.email;
        }


        res.locals.user_id = decoded.user_id;
        res.locals.username = decoded.username;
        res.locals.role = decoded.role;
        next();
    });

}

export { authentication };

