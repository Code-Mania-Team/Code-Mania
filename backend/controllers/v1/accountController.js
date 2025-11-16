import jwt from "jsonwebtoken";
import User from "../../models/user.js";

class AccountController {
    constructor() {
        this.user = new User();
    }

    // SINGLE ENDPOINT: request OTP (signup or login)
    async requestOtp(req, res) {
        const { email, password } = req.body || {};

        try {
            let authUser;
            let isNewUser = false;

            const existingUser = await this.user.findByEmail(email);

            if (existingUser) {
                // Login
                authUser = await this.user.loginOtp(email, password);
            } else {
                // Signup
                authUser = await this.user.signUp(email, password);
                isNewUser = true;
            }

            res.send({
                success: true,
                type: "otp_sent",
                isNewUser,
                email: authUser?.email
            });
        } catch (err) {
            console.error("requestOtp error:", err);
            res.send({
                success: false,
                message: "Unable to send OTP. Please try again."
            });
        }
    }

    // VERIFY OTP
    async verifyOtp(req, res) {
        const { user_id, code } = req.body || {};

        try {
            const authUser = await this.user.verifyOtp(user_id, code);

            const profile = await this.user.getProfile(authUser.user_id);

            if (!profile?.username) {
                return res.send({
                    success: true,
                    requiresUsername: true,
                    user_id: authUser.user_id
                });
            }

            const token = jwt.sign(
                { user_id: authUser.user_id, username: profile.username },
                process.env.API_SECRET_KEY,
                { expiresIn: "1d" }
            );

            res.send({
                success: true,
                requiresUsername: false,
                token
            });
        } catch (err) {
            res.send({
                success: false,
                message: err.message
            });
        }
    }

    // SET USERNAME
    async setUsername(req, res) {
        const { user_id, username } = req.body || {};

        try {
            await this.user.setUsername(user_id, username);

            const token = jwt.sign(
                { user_id, username },
                process.env.API_SECRET_KEY,
                { expiresIn: "1d" }
            );

            res.send({
                success: true,
                message: "Username set successfully",
                token
            });
        } catch (err) {
            res.send({
                success: false,
                message: err.message
            });
        }
    }

    // PROFILE
    async profile(req, res) {
        try {
            const userId = res.locals.user_id;
            const profile = await this.user.getProfile(userId);
            res.send({ success: true, data: profile });
        } catch (err) {
            res.send({ success: false, message: err.message });
        }
    }

    async updateProfile(req, res) {
        const { username, bio } = req.body || {};
        const userId = res.locals.user_id;

        try {
            await this.user.updateProfile(userId, { username, bio });

            const token = username
                ? jwt.sign({ user_id: userId, username }, process.env.API_SECRET_KEY, { expiresIn: "1d" })
                : null;

            res.send({ success: true, message: "Profile updated", token });
        } catch (err) {
            res.send({ success: false, message: err.message });
        }
    }

    async deleteUser(req, res) {
        const userId = res.locals.user_id;

        try {
            await this.user.deleteUser(userId);
            res.send({ success: true, message: "Account deleted" });
        } catch (err) {
            res.send({ success: false, message: err.message });
        }
    }
}

export default AccountController;
