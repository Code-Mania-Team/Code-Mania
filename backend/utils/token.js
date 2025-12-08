import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
    const payload = {
        user_id: user.id,
        username: user.username,
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