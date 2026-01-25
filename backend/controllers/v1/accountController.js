
import User from "../../models/user.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/token.js";
import UserToken from "../../models/userToken.js";
import crypto from "crypto";

class AccountController {
    constructor() {
        this.user = new User();
        this.userToken = new UserToken();
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

    // VERIFY OTP (SIGNUP)
    // =========================
    async verifyOtp(req, res) {
        try {
        const { email, otp } = req.body || {};
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP required" });
        }

        const authUser = await this.user.verifyOtp(email, otp);
        if (!authUser) {
            return res.status(401).json({ success: false, message: "Invalid OTP" });
        }

        const profile = await this.user.getProfile(authUser.user_id);

        // 🔑 Access token
        const accessToken = generateAccessToken({
            user_id: authUser.user_id,
            username: profile?.email,
        });

        const refreshToken = crypto.randomBytes(40).toString('hex');
        const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');

        const existingUser = await this.userToken.findByUserId(authUser.user_id);
        if (existingUser) {
            // Update existing token    
            await this.userToken.update(authUser.user_id, hashedRefresh);   
        } else {
            // Create new token
            await this.userToken.createUserToken(authUser.user_id, hashedRefresh);
        }

        // 🍪 HttpOnly cookie
        // 8. Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refreshToken', JSON.stringify({ 
            refreshToken
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        return res.status(200).json({
            success: true,
            accessToken, //remove if using cookie-only
            requiresUsername: !profile?.username,
            user_id: authUser.user_id,
        });
        } catch (err) {
        console.error("verifyOtp error:", err);
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
        try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required" });
        }

        const authUser = await this.user.verify(email, password);
        if (!authUser) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const profile = await this.user.getProfile(authUser.user_id);

        const accessToken = generateAccessToken({
            user_id: authUser.user_id,
            username: profile?.email,
        });
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');


        // 🔁 Overwrites previous session (single-session)
        const existing = await this.userTokenModel.findByUserId(user.user_id);
            if (existing) {
                await this.userTokenModel.update(user.user_id, hashedRefresh);
            } else {
                await this.userTokenModel.create(user.user_id, hashedRefresh);
            }

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            accessToken,
            username: profile?.username || null,
            user_id: authUser.user_id,
        });
        } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ success: false, message: err.message });
        }
    }


        // =========================
    // REFRESH TOKEN (ROTATION)
    // =========================
    async refresh(req, res) {
        try {
        const oldRefreshToken = req.cookies.refreshToken;
        if (!oldRefreshToken) {
            return res.status(401).json({ success: false, message: "No refresh token" });
        }

        const userId = res.locals.user_id;

        // 🔁 Rotate token
        const { refreshToken: newRefreshToken } =
            await this.userToken.rotate(userId, oldRefreshToken);

        const accessToken = generateAccessToken({
            user_id: userId,
            username: res.locals.username,
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            accessToken,
        });
        } catch (err) {
        console.error("refresh error:", err);

        // 🚨 Token reuse / invalid token
        res.clearCookie("refreshToken");
        return res.status(401).json({
            success: false,
            message: "Invalid refresh token",
        });
        }
    }


    // PROFILE & other methods remain mostly unchanged
    async profile(req, res) {
        try {
            const token = req.cookies.accessToken || 
                    req.headers.authorization?.replace('Bearer ', '');
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
        const userId = res.locals.user_id;

        await this.userToken.invalidateByUserId(userId);

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        return res.status(200).json({ success: true, message: "Logged out" });
        } catch (err) {
        return res.status(500).json({ success: false, message: "Logout failed" });
        }
    }
}


export default AccountController;
