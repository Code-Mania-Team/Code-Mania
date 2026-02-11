import ForgotPasswordService from "../../services/forgotPasswordService.js";
import forgotPassword from "../../models/forgotPassword.js";    
class ForgotPasswordController {
    constructor() {
        this.forgotPasswordService = new ForgotPasswordService();
    }

    // Step 1: Request OTP
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body || {};
            if (!email) {
                return res.status(400).json({ success: false, message: "Email is required" });
            }

            const response = await this.forgotPasswordService.requestPasswordReset(email);
            return res.status(200).json({
                success: true,
                message: "Password reset OTP sent to email",
                data: { email: response?.email },
            });
        } catch (err) {
            console.error("requestPasswordResetOtp error:", err);
            return res.status(400).json({
                success: false,
                message: err.message === "Email not found" ? "Email not registered" : err.message || "Failed to process password reset request",
            });
        }
    }

    // Step 2: Verify OTP
    async verifyPasswordReset(req, res) {
        try {
            const { email, otp } = req.body || {};
            if (!email || !otp) {
                return res.status(400).json({ success: false, message: "Email and OTP are required" });
            }
            const result = await this.forgotPasswordService.verifyPasswordReset(email, otp);
            return res.status(200).json(result);
        } catch (err) {
            console.error("verifyPasswordResetOtp error:", err);
            return res.status(400).json({
                success: false,
                message: err.message || "Failed to verify OTP",
            });
        }
    }

    // Step 3: Reset Password
    async resetPassword(req, res) {
        try {
            const { email, newPassword } = req.body || {};
            if (!email || !newPassword) {
                return res.status(400).json({ success: false, message: "Email and new password are required" });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
            }

            const updated = await this.forgotPasswordService.resetPassword(email, newPassword);
            return res.status(200).json({
                success: true,
                message: "Password reset successfully",
            });
        } catch (err) {
            console.error("resetPassword error:", err);
            return res.status(400).json({
                success: false,
                message: err.message || "Failed to reset password",
            });
        }
    }
}

export default ForgotPasswordController;