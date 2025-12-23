
import User from "../../models/user.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/token.js";

class AccountController {
    constructor() {
        this.user = new User();
    }

    // REQUEST OTP (SIGNUP)
    async requestOtp(req, res) {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required" });
            }

            const response = await this.user.createTempUser(email, password);
            return res.status(200).json({
                success: true,
                message: "OTP sent to email",
                data: { email: response?.email, isNewUser: true },
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: err.message === "email" ? "Email already exists" : err.message || "Failed to process OTP request",
            });
        }
    }

    // VERIFY OTP
    async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body || {};
            if (!email || !otp) {
                return res.status(400).json({ success: false, message: "Email and OTP code are required" });
            }

            const authUser = await this.user.verifyOtp(email, otp);
            if (!authUser) return res.status(401).json({ success: false, message: "Invalid OTP or user not found" });

            const profile = await this.user.getProfile(authUser.user_id);

            // Generate split tokens
            const accessToken = generateAccessToken({
                user_id: authUser.user_id,
                username: profile?.username,
            });

            const refreshToken = generateRefreshToken({
                user_id: authUser.user_id,
                username: profile?.username,
            });

            // Send refresh token as HttpOnly cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            return res.status(200).json({
                success: true,
                message: "OTP verified successfully",
                accessToken, // frontend stores in memory
                requiresUsername: !profile?.username,
                user_id: authUser.user_id,
            });
        } catch (err) {
            console.error("verifyOtp error:", err);
            if (["OTP not found", "OTP expired", "OTP already used"].some(e => err.message.includes(e))) {
                return res.status(401).json({ success: false, message: err.message });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async setUsername(req, res) {
        const { username } = req.body || {};
        const user_id = res.locals.user_id;
        if (!user_id || !username) return res.status(400).json({ success: false, message: "User ID and username are required" });

        try {
            const updated = await this.user.setUsername(user_id, username);
            if (!updated) return res.status(400).json({ success: false, message: "Failed to set username" });

            // Generate new access token (split approach)
            const accessToken = generateAccessToken({ user_id, username });

            return res.status(200).json({
                success: true,
                message: "Username set successfully",
                accessToken, // frontend updates memory
            });
        } catch (err) {
            console.error("setUsername error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async login(req, res) {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });

        try {
            const authUser = await this.user.verify(email, password);
            if (!authUser) return res.status(401).json({ success: false, message: "Invalid email or password" });

            const profile = await this.user.getProfile(authUser.user_id);

            // Generate split tokens
            const accessToken = generateAccessToken({
                user_id: authUser.user_id,
                username: profile?.username,
            });
            const refreshToken = generateRefreshToken({
                user_id: authUser.user_id,
                username: profile?.username,
            });

            // Send refresh token as HttpOnly cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            return res.status(200).json({
                success: true,
                message: "Login successful",
                accessToken,
                requiresUsername: !profile?.username,
                username: profile?.username || null,
                user_id: authUser.user_id,
            });
        } catch (err) {
            console.error("login error:", err);
            return res.status(500).json({ success: false, message: err.message || "Login failed" });
        }
    }

    // PROFILE & other methods remain mostly unchanged
    async profile(req, res) {
        try {
            const userId = res.locals.user_id;
            const data = await this.user.getProfile(userId);
            if (!data) return res.status(404).json({ success: false, message: "Profile not found" });

            return res.status(200).json({ success: true, message: "Profile retrieved successfully", data });
        } catch (err) {
            console.error("profile error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async updateProfile(req, res) {
        const { username, bio } = req.body || {};
        const userId = res.locals.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        try {
            const updated = await this.user.updateProfile(userId, { username, bio });
            if (!updated) {
                return res.status(400).json({ success: false, message: "Failed to update profile" });
            }

            // Generate new access token only if username changed
            let accessToken = null;
            if (username) {
                accessToken = generateAccessToken({ user_id: userId, username });
            }

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                accessToken, // frontend updates memory if present
            });
        } catch (err) {
            console.error("updateProfile error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // DELETE USER
    async deleteUser(req, res) {
        const userId = res.locals.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        try {
            const deleted = await this.user.deleteUser(userId);
            if (!deleted) return res.status(400).json({ success: false, message: "Failed to delete account" });

            // Clear refresh token cookie
            res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });

            return res.status(200).json({ success: true, message: "Account deleted successfully" });
        } catch (err) {
            console.error("deleteUser error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async logout(req, res) {
        try {
            res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
            return res.status(200).json({ success: true, message: "Logged out successfully" });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Failed to logout" });
        }
    }
}

export default AccountController;
