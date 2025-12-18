import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
    const payload = {
        user_id: user.id,
        username: user.username,
        email: user.email
    };

    return jwt.sign(payload, process.env.ACCESS_TOKEN, { expiresIn: "10s" });
};

export const generateRefreshToken = (user) => {
    const payload = {
        user_id: user.id,
        username: user.username,
    };
    return jwt.sign(payload, process.env.REFRESH_TOKEN, { expiresIn: "30s" });

}

// Verify Access Token
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new Error("Invalid or expired access token");
    }
}

// Verify Refresh Token
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new Error("Invalid or expired refresh token");
    }
}