import jwt from "jsonwebtoken";
import User from "../../models/user.js";

class AccountController {
    constructor() {
        this.user = new User();
    }



    // REQUEST OTP (SIGNUP)
    async requestOtp(req, res) {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        

        try {
            const response = await this.user.createTempUser(email, password);

            res.send({
                success: true,
                message: "OTP sent to email",
                data: {
                    email: response?.email,
                    isNewUser: true,
                },
            });

        } catch (err) {
            res.send({
                success: false,
                message:
                    err.message === "email"
                        ? "Email already exists"
                        : err.message || "Failed to process OTP request",
            });
        }
    }


    // VERIFY OTP
    async verifyOtp(req, res) {
        const { email, otp } = req.body || {};

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP code are required"
            });
        }

        try {
            const authUser = await this.user.verifyOtp(email, otp);

            if (!authUser) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid OTP or user not found"
                });
            }

            const profile = await this.user.getProfile(authUser.user_id);

            // Issue token immediately, even if username is missing
            const tokenPayload = { user_id: authUser.user_id };
            if (profile?.username) tokenPayload.username = profile.username;

            const token = jwt.sign(tokenPayload, process.env.API_SECRET_KEY, { expiresIn: "1d" });

            return res.status(200).json({
                success: true,
                token,
                requiresUsername: !profile?.username, 
                user_id: authUser.user_id
            });

        } catch (err) {
            console.error("verifyOtp error:", err);

            if (
                err.message.includes("OTP not found") ||
                err.message.includes("OTP expired") ||
                err.message.includes("OTP already used")
            ) {
                return res.status(401).json({
                    success: false,
                    message: err.message
                });
            }

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }

    async setUsername(req, res) {
        const { username } = req.body || {};
         const user_id = res.locals.user_id;

        if (!user_id || !username) {
            return res.status(400).json({
                success: false,
                message: "User ID and username are required"
            });
        }

        try {
            const updated = await this.user.setUsername(user_id, username);
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: "Failed to set username"
                });
            }

            const token = jwt.sign(
                { user_id, username },
                process.env.API_SECRET_KEY,
                { expiresIn: "1d" }
            );

            return res.status(200).json({
                success: true,
                message: "Username set successfully",
                token
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
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        try {
            // Verify user credentials
            const authUser = await this.user.verify(email, password);
            if (!authUser) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Fetch user profile
            const data = await this.user.getProfile(authUser.user_id);

            // Generate JWT
            const tokenPayload = { user_id: authUser.user_id };
            if (data?.username) tokenPayload.username = data.username;

            const token = jwt.sign(tokenPayload, process.env.API_SECRET_KEY, { expiresIn: "1d" });

            return res.status(200).json({
                success: true,
                token,
                requiresUsername: !data?.username,
                username: data?.username || null,
                user_id: authUser.user_id,
            });
        } catch (err) {
            console.error("login error:", err);
            return res.status(500).json({
                success: false,
                message: err.message || "Login failed",
            });
        }
    }

    // GET PROFILE
    async profile(req, res) {
        try {
            const userId = res.locals.user_id;
            console.log("Fetching profile for user ID:", userId);
            const data = await this.user.getProfile(userId);
            console.log("Retrieved profile:", data);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Profile not found"
                });
            }
            return res.status(200).json({ 
                success: true,
                message: "Profile retrieved successfully", 
                data: data 
            });
        } catch (err) {
            console.error("profile error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // UPDATE PROFILE
    async updateProfile(req, res) {
        const { username, bio } = req.body || {};
        const userId = res.locals.user_id;

        try {
            const updated = await this.user.updateProfile(userId, { username, bio });
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: "Failed to update profile"
                });
            }

            const token = username
                ? jwt.sign({ user_id: userId, username }, process.env.API_SECRET_KEY, { expiresIn: "1d" })
                : null;

            return res.status(200).json({ success: true, message: "Profile updated", token });
        } catch (err) {
            console.error("updateProfile error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // DELETE USER
    async deleteUser(req, res) {
        const userId = res.locals.user_id;

        try {
            const deleted = await this.user.deleteUser(userId);
            if (!deleted) {
                return res.status(400).json({
                    success: false,
                    message: "Failed to delete account"
                });
            }
            return res.status(200).json({ success: true, message: "Account deleted" });
        } catch (err) {
            console.error("deleteUser error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}

export default AccountController;
