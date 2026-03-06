import { supabase } from "../core/supabaseClient.js";

class TempUser {
    constructor() {
        this.db = supabase;
    }

    async upsertByEmail({ email, password, otp, expiry_time }) {
        const { data, error } = await this.db
            .from("temp_user")
            .upsert(
                {
                    email,
                    password,
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
        const { data, error } = await this.db
            .from("temp_user")
            .select("*")
            .eq("email", email)
            .eq("otp", otp)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async markVerified(temp_user_id) {
        const { data, error } = await this.db
            .from("temp_user")
            .update({ is_verified: true })
            .eq("temp_user_id", temp_user_id)
            .select("*")
            .maybeSingle();

        if (error) throw error;
        return data;
    }
}

export default TempUser;