import { supabase } from "../core/supabaseClient.js";
import logger from "../utils/logger.js";

class forgotPassword {
    constructor() {
        this.db = supabase;
    }

    async upsertByEmail({ email, otp, expiry_time }) {
        const { data, error } = await this.db
            .from("temp_user")
            .upsert(
                {
                    email,
                    password: null, // Explicitly set to null for forgot password
                    otp,
                    expiry_time,
                    is_verified: false,
                    created_at: new Date().toISOString(),
                },
                { onConflict: ["email"] }
            )
            .select("*")
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async findByEmailAndOtp(email, otp) {
        logger.info("Finding OTP entry for email:", email, "OTP:", otp);
        const { data, error } = await this.db
            .from("temp_user")
            .select("*")
            .eq("email", email)
            .eq("otp", otp)
            .maybeSingle();

        logger.info("OTP Entry found:", data);
        logger.info("Error:", error);
        
        if (error) throw error;
        return data;
    };

    async deleteById(temp_user_id) {
        const { error } = await this.db
            .from("temp_user")
            .delete()
            .eq("temp_user_id", temp_user_id);

        if (error) throw error;
}
    async findByEmail(email) {
        const { data, error } = await this.db
            .from("temp_user")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async markVerified(temp_user_id) {
        logger.info("Marking OTP as verified for temp_user_id:", temp_user_id);
        const { data, error } = await this.db
            .from("temp_user")
            .update({ is_verified: true })
            .eq("temp_user_id", temp_user_id)
            .select("*")
            .maybeSingle();

        logger.info("Mark verified result:", data);
        logger.info("Mark verified error:", error);

        if (error) throw error;
        return data;
    }
}

export default forgotPassword;
