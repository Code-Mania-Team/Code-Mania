import User from "../../models/user.js";
import AccountService from "../../services/accountService.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/token.js";
import UserToken from "../../models/userToken.js";
import crypto from "crypto";

class AccountController {
    constructor() {
        this.user = new User();
        this.accountService = new AccountService();
        this.userToken = new UserToken();
        this.refreshInProgress = false; // Prevent race conditions
    }
    // REQUEST OTP (SIGNUP)
    async requestOtp(req, res) {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Email and password are required" });
            }

            const response = await this.accountService.requestSignupOtp(email, password);            
            return res.status(200).json({
                success: true,
                message: "OTP sent to email",
                data: { email: response?.email, isNewUser: true }
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: err.message === "email" ? "Email already exists" : err.message || "Failed to process OTP request",
            });

        }

    }
    // VERIFY OTP (SIGNUP)
    async verifyOtp(req, res) {

        try {
            const { email, otp } = req.body || {};
            if (!email || !otp) {
                return res.status(400).json({ 
                success: false, 
                message: "Email and OTP required" });
            }
            const authUser = await this.accountService.verifySignupOtp(email, otp);
            if (!authUser) {
                return res.status(401).json({ 
                success: false, 
                message: "Invalid OTP" });
            }
            const profile = await this.user.getProfile(authUser.user_id);
            // 🔑 Access token
            const accessToken = generateAccessToken({
                user_id: authUser.user_id,
                username: profile?.email,
                role: profile?.role,
            });
            const refreshToken = generateRefreshToken();
            const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
            console.log("🔑 [OTP] Generated refresh token:", refreshToken);
            console.log("🔑 [OTP] Hashed refresh token:", hashedRefresh);
            const existingUser = await this.userToken.findByUserId(authUser.user_id);
            console.log("🔑 [OTP] Existing token:", existingUser);

            if (existingUser) {
                console.log("🔄 [OTP] Updating existing token");
                // Update existing token    
                await this.userToken.update(authUser.user_id, hashedRefresh);   
            } else {
                console.log("➕ [OTP] Creating new token");
                // Create new token
                await this.userToken.createUserToken(authUser.user_id, hashedRefresh);
            }
            // 🍪 HttpOnly cookie
            // 8. Set cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 1 * 60 * 1000, // 1 minute for testing
                //maxAge: 24 * 60 * 60 * 1000

            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                //sameSite: 'lax', 
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                //domain: 'localhost' // Explicit domain for cross-origin

            });

            return res.status(200).json({
                success: true,
                //accessToken, //remove if using cookie-only
                requiresUsername: !profile?.username,
                user_id: authUser.user_id,
            });
        } catch (err) {

        console.error("verifyOtp error:", err);
        return res.status(500).json({ 
            success: false, 
            message: err.message });
        }

    }



    async setUsernameAndCharacter(req, res) {
        const { username, character_id, full_name } = req.body || {};
        const user_id = res.locals.user_id;
        if (!user_id || !username) return res.status(400).json({ 
            success: false, 
            message: "User ID and username are required (full name is optional)" 
        });
        
        try {
            const updated = await this.user.setUsernameandCharacter(user_id, username, character_id, full_name);
            if (!updated) 

                return res.status(400).json({ 
                    success: false, 
                    message: "Failed to set username, character, and full name" 
                });
            // Generate new access token (split approach)

            const accessToken = generateAccessToken({ user_id, username, role: profile?.role });
            return res.status(200).json({
                success: true,
                message: "Username, character, and full name set successfully",
                //accessToken, // frontend updates memory
            });

        } catch (err) {

            console.error("setUsername error:", err);

            return res.status(500).json({ 
                success: false, 
                message: err.message 
            });

        }

    }


    async login(req, res) {

        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Email and password required" });
            }

            const authUser = await this.accountService.loginWithPassword(email, password);

            if (!authUser) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Invalid credentials" 
                });
            }

            const profile = await this.user.getProfile(authUser.user_id);

            const accessToken = generateAccessToken({
                user_id: authUser.user_id,
                username: profile?.email,
                role: profile?.role,
            });

            const refreshToken = generateRefreshToken();
            const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');

            // 🔁 Overwrites previous session (single-session)
            const existing = await this.userToken.findByUserId(authUser.user_id);
            console.log("Existing token:", existing);
                if (existing) {
                    console.log("🔄 Updating existing token");
                    await this.userToken.update(authUser.user_id, hashedRefresh);
                } else {
                    console.log("➕ Creating new token");
                    await this.userToken.createUserToken(authUser.user_id, hashedRefresh);
                }



            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                //sameSite: "lax", // Changed from "strict" to "lax"
                sameSite: "strict",
                //maxAge: 1 * 60 * 1000, // 1 minute for testing
                maxAge: 24 * 60 * 60 * 1000
                });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                //sameSite: "lax", // Changed from "strict" to "lax"
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                //domain: 'localhost' // Explicit domain for cross-origin
            });

            console.log("character_id", profile?.character_id)

            return res.status(200).json({
                success: true,
                accessToken,
                username: profile?.username || null,
                character_id: profile?.character_id,
                user_id: authUser.user_id,
        });

        } catch (err) {
            console.error("login error:", err);
            if (err?.message === 'Email not registered yet') {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Email not registered yet' });
            }
            return res.status(500).json({ 
                success: false, 
                message: err.message 
            });
        }
    }
    

        
    // GOOGLE LOGIN/SIGNUP
    async googleLogin(req, res) {
        const { id, emails, provider } = req.user;
        const data = await this.accountService.googleLogin(id, emails[0].value, provider);
        
        try {
            if (data) {
                const accessToken = generateAccessToken({
                    user_id: data.id,
                    username: data.email,
                    role: data.role
                });

                const refreshToken = crypto.randomBytes(40).toString('hex');
                const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');

                const existingUser = await this.userToken.findByUserId(data.id);
                if (existingUser) {
                    await this.userToken.update(data.id, hashedRefresh);
                } else {
                    await this.userToken.createUserToken(data.id, hashedRefresh);
                }

                const isLocalhost = (req.hostname === 'localhost' || req.hostname === '127.0.0.1' || req.hostname === '::1');
                const cookieSecure = process.env.NODE_ENV === "production" && !isLocalhost;
                const cookieSameSite = isLocalhost ? "lax" : "strict";

                res.cookie('accessToken', accessToken, {
                    httpOnly: true,
                    secure: cookieSecure,
                    sameSite: cookieSameSite,
                    maxAge: 15 * 60 * 1000
                });
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: cookieSecure,
                    sameSite: cookieSameSite,
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                });

                return res.redirect(`http://localhost:5173/dashboard?success=true`);
            } else {
                return res.redirect(`http://localhost:5173/login?error=auth_failed`);
            }
        } catch (err) {
            console.error('Google login error:', err);
            return res.redirect(`http://localhost:5173/login?error=server_error`);
        }
    }

    // REFRESH TOKEN (ROTATION)
    async refresh(req, res) {
        try {
            // Prevent race conditions
            if (this.refreshInProgress) {
                return res.status(429).json({ 
                    success: false, 
                    message: "Too many requests" 
                });
            }

            const rawRefreshToken = req.cookies.refreshToken;
            if (!rawRefreshToken) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Authentication required" 
                });
            }

            // Set flag to prevent race conditions
            this.refreshInProgress = true;

            try {
                // Backward compatible: previous versions stored JSON in cookie
                let oldRefreshToken = rawRefreshToken;
                if (typeof rawRefreshToken === 'string' && rawRefreshToken.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(rawRefreshToken);
                        if (parsed?.refreshToken) {
                            oldRefreshToken = parsed.refreshToken;
                        }
                    } catch(e){
                        oldRefreshToken = rawRefreshToken;
                    }
                }
                
                // Rotate token (opaque refresh token)
                const { user_id, refreshToken: newRefreshToken } = await this.userToken.rotate(oldRefreshToken);
                
                const profile = await this.user.getProfile(user_id);
                const accessToken = generateAccessToken({
                    user_id,
                    username: profile?.email,
                    role: profile?.role,
                });

                res.cookie("accessToken", accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 24 * 60 * 60 * 1000
                });

                res.cookie("refreshToken", newRefreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                    //domain: process.env.NODE_ENV === "production" ? undefined : 'localhost'
                });

                return res.status(200).json({
                    success: true,
                    accessToken,
                });

            } finally {
                // Clear flag after completion
                this.refreshInProgress = false;
            }

        } catch (err) {
            this.refreshInProgress = false; // Ensure flag is cleared on error
            
            // Clear refresh token only on actual invalid token
            if (err.message === 'Invalid refresh token') {
                res.clearCookie("refreshToken");
            }
            
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again.",
            });
        }
    }
    // PROFILE & other methods remain mostly unchanged

    async profile(req, res) {

        try {

            const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');
            const userId = res.locals.user_id;

            const data = await this.user.getProfile(userId);

            if (!data) return res.status(404).json({ 
                success: false, 
                message: "Profile not found" 
            });
            return res.status(200).json({ 
                success: true, 
                message: "Profile retrieved successfully", 
                data 
            });
        } catch (err) {

            console.error("profile error:", err);
            return res.status(500).json({ 
                success: false, 
                message: err.message 
            });
        }

    }



    async updateProfile(req, res) {

        const { username, full_name } = req.body || {};

        console.log("UPDATE PROFILE", username, full_name);

        const userId = res.locals.user_id;

        const currentUsername = res.locals.username;
        const role = res.locals.role;

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized" 
            });
        }
                                                           
        try {

            const updated = await this.user.updateProfile(userId, { username, full_name });

            if (!updated) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Failed to update profile" 
                });

            }
            // Generate new access token only if username changed
            const tokenUsername = username ?? currentUsername;
            const accessToken = generateAccessToken({ user_id: userId, username: tokenUsername, role: role });

            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000
                });

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                full_name: updated?.full_name,
                accessToken // frontend updates memory if present
            });

        } catch (err) {
            console.error("updateProfile error:", err);
            return res.status(500).json({ 
                success: false, 
                message: err.message 
            });
        }

    }



    // DELETE USER

    async deleteUser(req, res) {
        const userId = res.locals.user_id; 
        console.log("Model deleting user_id:", userId);
        if (!userId) 
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized" 
            });

        try {
            const deleted = await this.user.delete(userId);
            if (!deleted) return res.status(400).json({ 
                success: false, 
                message: "Failed to delete account" 
            });

            // Clear refresh token cookie
            res.clearCookie("refreshToken", 
                { httpOnly: true, 
                  secure: process.env.NODE_ENV === "production", 
                  sameSite: "strict" 
            });

            
             res.clearCookie("accessToken", 
                { httpOnly: true, 
                  secure: process.env.NODE_ENV === "production", 
                  sameSite: "strict" 
            });

            return res.status(200).json({ 
                success: true, 
                message: "Account deleted successfully" 
            });

        } catch (err) {

            console.error("deleteUser error:", err);
            return res.status(500).json({ 
                success: false, 
                message: err.message 
            });
        }

    }



    async logout(req, res) {
        try {
            const userId = res.locals?.user_id;

            if (userId) {
                await this.userToken.invalidateByUserId(userId);
            }
            res.clearCookie("accessToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
            });

            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
            });

            return res.status(200).json({ 
                success: true, 
                message: "Logged out" 
            });

        } catch (err) {
            return res.status(500).json({ 
                success: false, 
                message: "Logout failed" 
            });
        }
    }

}

export default AccountController;