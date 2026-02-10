import User from "../models/user.js";
import ForgotPassword from "../models/forgotPassword.js";
import { encryptPassword } from "../utils/hash.js";
import { generateOtp, sendOtpEmail } from "../utils/otp.js";

class ForgotPasswordService {
    constructor() {
        this.user = new User();
        this.forgotPassword = new ForgotPassword();
    }

    async requestPasswordReset(email) {
        const existingUser = await this.user.findByEmail(email);
        if (!existingUser) {
            throw new Error("Email not found");
        }

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const record = await this.forgotPassword.upsertByEmail({
            email,
            password: '', // No password needed for reset
            otp,
            expiry_time: expiresAt.toISOString(),
        });

        await sendOtpEmail(email, otp);
        return record;
    }

    async verifyPasswordReset(email, otp) {
        console.log("Verifying OTP for email:", email, "with OTP:", otp);
        const otpEntry = await this.forgotPassword.findByEmailAndOtp(email, otp);

        if (!otpEntry) throw new Error("Invalid or expired OTP");
        if (otpEntry.is_verified) throw new Error("OTP already used");
        if (new Date(otpEntry.expiry_time) < new Date()) throw new Error("OTP expired");

        // Mark the OTP as verified
        await this.forgotPassword.markVerified(otpEntry.temp_user_id);

        return { success: true, message: "OTP verified successfully" };
    }

    async resetPassword(email, newPassword) {
        const otpEntry = await this.forgotPassword.findByEmail(email);

        if (!otpEntry) throw new Error("No password reset request found");
        if (!otpEntry.is_verified) throw new Error("OTP not verified yet");

        // Update the user's password
        const hashedPassword = encryptPassword(newPassword);
        const updated = await this.user.updatePassword(email, hashedPassword);

        if (!updated) throw new Error("Failed to update password");

        return updated;
    }
}

export default ForgotPasswordService;
