import jwt from "jsonwebtoken";
import crypto from 'crypto';

// Generate short-lived access token (sent to frontend in JSON)
export const generateAccessToken = (user) => {
    const payload = {
        user_id: user.user_id || user.id,
        username: user.username || user.email,
    };

    // Short-lived token, e.g., 15 minutes
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
};

// Generate long-lived refresh token (stored in HttpOnly cookie)
export function generateRefreshToken() {
    return crypto.randomBytes(32).toString('base64url');

};

// Verify access token
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new Error("Invalid or expired access token");
    }
}

// Verify refresh token
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new Error("Invalid or expired refresh token");
    }
}

// Debug to ensure secrets are loaded
console.log("ACCESS_TOKEN_SECRET:", !!process.env.ACCESS_TOKEN_SECRET);
console.log("REFRESH_TOKEN_SECRET:", !!process.env.REFRESH_TOKEN_SECRET);
