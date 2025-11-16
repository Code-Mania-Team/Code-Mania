import { supabase } from "../core/supabaseClient.js";
import { encryptPassword } from "../utils/hash.js";
import { generateOtp, sendOtpEmail } from "../utils/otp.js";

class User {
    constructor() {
        this.db = supabase;
    }

    // Helper: find user by email
    async findByEmail(email) {
        const { data } = await this.db
            .from("users")
            .select("user_id, email, password, username")
            .eq("email", email)
            .single();
        return data ?? null;
    }

    // SIGNUP: create user + send OTP
    async signUp(email, password) {
        const hashedPassword = encryptPassword(password);

        const { data: user, error } = await this.db
            .from("users")
            .insert({ email, password: hashedPassword })
            .select()
            .single();
        if (error) throw error;

        await this.generateAndSendOtp(user.user_id, email, true);

        return user;
    }

    // LOGIN: verify password + send OTP
    async loginOtp(email, password) {
        const user = await this.findByEmail(email);
        if (!user) throw new Error("Email not registered");

        const hashedPassword = encryptPassword(password);
        if (hashedPassword !== user.password) throw new Error("Incorrect password");

        await this.generateAndSendOtp(user.user_id, email, false);

        return user;
    }

    // GENERATE OTP AND OVERWRITE PREVIOUS
    async generateAndSendOtp(user_id, email, isNewUser = true) {
        const code = generateOtp();
        const expiry_time = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

        // Upsert OTP (overwrite previous)
        await this.db.from("otp").upsert(
            { user_id, code, is_verified: false, expiry_time },
            { onConflict: ["user_id"] }
        );

        await sendOtpEmail(email, code, isNewUser);
    }

    // VERIFY OTP
    async verifyOtp(user_id, code) {
        const { data: otpEntry } = await this.db
            .from("otp")
            .select("otp_id, is_verified, expiry_time")
            .eq("user_id", user_id)
            .eq("code", code)
            .single();

        if (!otpEntry) throw new Error("OTP not found");
        if (otpEntry.is_verified) throw new Error("OTP already used");
        if (new Date(otpEntry.expiry_time) < new Date()) throw new Error("OTP expired");

        // Mark OTP as verified
        await this.db.from("otp").update({ is_verified: true }).eq("otp_id", otpEntry.otp_id);

        // Return user
        const { data: user } = await this.db
            .from("users")
            .select("*")
            .eq("user_id", user_id)
            .single();

        return user;
    }

    // ONE-TIME USERNAME SETUP
    async setUsername(user_id, username) {
        const { data } = await this.db
            .from("users")
            .update({ username })
            .eq("user_id", user_id)
            .select()
            .single();
        return data;
    }

    // PROFILE
    async getProfile(user_id) {
        const { data } = await this.db
            .from("users")
            .select("user_id, email, username, fullname, profile_image, bio, created_at")
            .eq("user_id", user_id)
            .single();
        return data;
    }

    async updateProfile(user_id, fields) {
        const { data } = await this.db
            .from("users")
            .update(fields)
            .eq("user_id", user_id)
            .select()
            .single();
        return data;
    }

    async deleteUser(user_id) {
        const { data } = await this.db
            .from("users")
            .delete()
            .eq("user_id", user_id)
            .select()
            .single();
        return data;
    }
}

export default User;
