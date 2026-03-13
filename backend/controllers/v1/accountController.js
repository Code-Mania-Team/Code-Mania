import User from "../../models/user.js";
import AccountService from "../../services/accountService.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/token.js";
import UserToken from "../../models/userToken.js";
import crypto from "crypto";
import Achievements from "../../models/achievements.js";

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const createCookieOptions = (maxAge) => {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        ...(isProduction ? { domain: ".codemania.fun" } : {}),
        maxAge,
    };
};

class AccountController {
    constructor() {
        this.user = new User();
        this.accountService = new AccountService();
        this.userToken = new UserToken();
        this.achievements = new Achievements();
        this.refreshInProgress = false; // Prevent race conditions
    }

    async publicProfile(req, res) {
        try {
            const username = String(req.params?.username || '').trim();
            if (!username) {
                return res.status(400).json({ success: false, message: 'Username is required' });
            }

            const profile = await this.user.getPublicProfileByUsername(username);
            if (!profile || profile?.role === 'admin') {
                return res.status(404).json({ success: false, message: 'Profile not found' });
            }

            return res.status(200).json({
                success: true,
                message: 'Public profile retrieved successfully',
                data: {
                    user_id: profile.user_id,
                    username: profile.username,
                    full_name: profile.full_name,
                    character_id: profile.character_id,
                    created_at: profile.created_at,
                },
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
        }
    }

    async publicProfileSummary(req, res) {
        try {
            const username = String(req.params?.username || '').trim();
            if (!username) {
                return res.status(400).json({ success: false, message: 'Username is required' });
            }

            const profile = await this.user.getPublicProfileByUsername(username);
            if (!profile || profile?.role === 'admin') {
                return res.status(404).json({ success: false, message: 'Profile not found' });
            }

            const summary = await this.accountService.getProfileSummary(profile.user_id);
            return res.status(200).json({
                success: true,
                ...summary,
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
        }
    }

    async publicLearningProgress(req, res) {
        try {
            const username = String(req.params?.username || '').trim();
            if (!username) {
                return res.status(400).json({ success: false, message: 'Username is required' });
            }

            const profile = await this.user.getPublicProfileByUsername(username);
            if (!profile || profile?.role === 'admin') {
                return res.status(404).json({ success: false, message: 'Profile not found' });
            }

            const progress = await this.accountService.getLearningProgress(profile.user_id);
            return res.status(200).json({ success: true, progress });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
        }
    }

    async publicAchievements(req, res) {
        try {
            const username = String(req.params?.username || '').trim();
            if (!username) {
                return res.status(400).json({ success: false, message: 'Username is required' });
            }

            const profile = await this.user.getPublicProfileByUsername(username);
            if (!profile || profile?.role === 'admin') {
                return res.status(404).json({ success: false, message: 'Profile not found' });
            }

            const achievements = await this.achievements.getUserAchievements(profile.user_id);
            return res.status(200).json({
                success: true,
                message: 'Achievements retrieved successfully',
                data: achievements,
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
        }
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

            if (err.message === "email_google") {
                return res.status(409).json({
                    success: false,
                    message: "This email is registered with Google sign-in. Please use 'Continue with Google' instead."
                });
            }

            if (err.message === "email") {
                return res.status(409).json({
                    success: false,
                    message: "Email already exists. Please sign in instead."
                });
            }

            return res.status(500).json({
                success: false,
                message: "Failed to process OTP request"
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
            res.cookie('accessToken', accessToken, createCookieOptions(24 * 60 * 60 * 1000));

            res.cookie('refreshToken', refreshToken, createCookieOptions(24 * 60 * 60 * 1000));

            return res.status(200).json({
                success: true,
                //accessToken, //remove if using cookie-only
                requiresUsername: !profile?.username,
                user_id: authUser.user_id,
            });
        } catch (err) {
            return res.status(500).json({ 
                success: false, 
                message: message || "Internal server error",
            });
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

            const accessToken = generateAccessToken({ user_id, username, role: res.locals.role });
            return res.status(201).json({
                success: true,
                message: "Username, character, and full name set successfully",
                accessToken,
            });

        } catch (err) {

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

            let authUser;
            try {
                authUser = await this.accountService.loginWithPassword(email, password);
            } catch (err) {
                if (err?.message === "use_google") {
                    return res.status(409).json({
                        success: false,
                        message: "This email is registered with Google sign-in. Please use 'Continue with Google'."
                    });
                }
                throw err;
            }

            if (!authUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid email and password" 
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
                if (existing) {
                    await this.userToken.update(authUser.user_id, hashedRefresh);
                } else {
                    await this.userToken.createUserToken(authUser.user_id, hashedRefresh);
                }
            res.cookie("accessToken", accessToken, createCookieOptions(24 * 60 * 60 * 1000));

            res.cookie("refreshToken", refreshToken, createCookieOptions(7 * 24 * 60 * 60 * 1000));

            return res.status(200).json({
                success: true,
                accessToken,
                username: profile?.username || null,
                character_id: profile?.character_id,
                user_id: authUser.user_id,
        });
        

        } catch (err) {

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
    

        
    // GOOGLE LOGIN/SIGNUP
    async googleLogin(req, res) {
        const { id, emails, provider } = req.user;

        try {
            const data = await this.accountService.googleLogin(id, emails[0].value, provider);
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

                res.cookie('accessToken', accessToken, createCookieOptions(24 * 60 * 60 * 1000));
                res.cookie("refreshToken", refreshToken, createCookieOptions(24 * 60 * 60 * 1000));

                 const isNew = data?.isNewUser === true;
                 return res.redirect(`${FRONTEND_URL}/?success=true&new=${isNew ? "1" : "0"}`);
            } else {
                return res.redirect(`${FRONTEND_URL}/?error=auth_failed`);
            }
        } catch (err) {
            if (err?.message === "use_password") {
                return res.redirect(`${FRONTEND_URL}/?error=use_password`);
            }
            if (err?.message === "auth_failed") {
                return res.redirect(`${FRONTEND_URL}/?error=auth_failed`);
            }
            return res.redirect(`${FRONTEND_URL}/?error=server_error`);
        }
    }

    // REFRESH TOKEN (ROTATION)
    async refresh(req, res) {
        try {
            const {} = req.body || {};
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

                res.cookie("accessToken", accessToken, createCookieOptions(24 * 60 * 60 * 1000));

                res.cookie("refreshToken", newRefreshToken, createCookieOptions(24 * 60 * 60 * 1000));
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

    async getProfileSummary(req, res) {
        try {
            const user_id = res.locals.user_id;

            if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
            }

            const summary = await this.accountService.getProfileSummary(user_id);

            return res.status(200).json({
            success: true,
            ...summary
            });

        } catch (err) {
            return res.status(500).json({
            success: false,
            message: err.message
            });
        }
    }

    async getLearningProgress(req, res) {
        try {
            const user_id = res.locals.user_id;

            const progress =
            await this.accountService.getLearningProgress(user_id);

            return res.status(200).json({
            success: true,
            progress
            });

        } catch (err) {
            return res.status(500).json({
            success: false,
            message: err.message
            });
        }
    }

    async profile(req, res) {

        try {

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

            return res.status(500).json({ 
                success: false, 
                message: err.message 
            });
        }

    }



    async updateProfile(req, res) {

        const { username, full_name, hasSeen_tutorial } = req.body || {};

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

            const updateFields = {};

            if (typeof username === "string") {
                updateFields.username = username;
            }

            if (typeof full_name === "string") {
                updateFields.full_name = full_name;
            }

            if (typeof hasSeen_tutorial === "boolean") {
                updateFields.hasSeen_tutorial = hasSeen_tutorial;
            }

            if (!Object.keys(updateFields).length) {
                return res.status(400).json({
                    success: false,
                    message: "No valid fields provided",
                });
            }

            const updated = await this.user.updateProfile(userId, updateFields);

            if (!updated) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Failed to update profile" 
                });

            }
          
            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                full_name: updated?.full_name,
                hasSeen_tutorial: updated?.hasSeen_tutorial,
            });

        } catch (err) {
            return res.status(500).json({ 
                success: false, 
                message: err.message 
            });
        }

    }



    // DELETE USER

    async deleteUser(req, res) {
        const userId = res.locals.user_id; 
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
