import { supabase } from "../core/supabaseClient.js";

class User {
    constructor() {
        this.db = supabase;
    }
    // Helper: find user by email

    async findByEmail(email) {
        const { data } = await this.db
            .from("users") // can be users table or temp_user (this should be temp_users with "s")
            .select("user_id, email, password, provider") // 
            .eq("email", email)
            .maybeSingle();
        return data;
    }

    async findByEmailAndPasswordHash(email, password) {
        const { data, error } = await this.db
            .from("users")
            .select("user_id, username, email, full_name, profile_image, provider, created_at")
            .eq("email", email)
            .eq("password", password);
        if (error) throw error;
        const [result] = data || [];
        return result;

    }

    async create({ email, password, provider }) {
        const { data, error } = await this.db
            .from("users")
            .insert({ email, password, provider })
            .select("*")
            .maybeSingle();
        if (error) throw error;
        return data;

    }



    //comment for now baka mabago ulit
    // async loginOtp(email, password) {

    //     const user = await this.findByEmail(email);

    //     if (!user) throw new Error("Email not registered");



    //     const hashedPassword = encryptPassword(password);

    //     if (hashedPassword !== user.password) throw new Error("Incorrect password");



    //     const otp = generateOtp();

    //     const expiresAt = new Date(Date.now() + 1000 * 60); // 1 min



    //     await this.db.from("temp_user").upsert(

    //         {

    //             email,

    //             otp,

    //             expiry_time: expiresAt.toISOString(),

    //             is_verified: false,

    //             created_at: new Date().toISOString()

    //         },

    //         { onConflict: "email" }

    //     );



    //     await sendOtpEmail(email, otp, false);

    //     return user;

    // }



    // // GENERATE OTP AND OVERWRITE PREVIOUS

    // async generateAndSendOtp(user_id, email, isNewUser = true) {

    //     const code = generateOtp();

    //     const expiry_time = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry



    //     // Upsert OTP (overwrite previous)

    //     await this.db.from("otp").upsert(

    //         { user_id, code, is_verified: false, expiry_time },

    //         { onConflict: ["user_id"] }

    //     );



    //     await sendOtpEmail(email, code, isNewUser);

    // }



    
    async getUserXp(user_id) {
        const { data, error } = await this.db
        .from("users_game_data")
        .select(`
            exercise_id,
            quests (
            experience
            )
        `)
        .eq("user_id", user_id);

        if (error) throw error;

        return data || [];
    }

    async getUserBadgeCount(user_id) {
        const { count, error } = await this.db
        .from("users_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user_id);

        if (error) throw error;

        return count || 0;
    }


    async getCompletedExercises(user_id) {
        const { data, error } = await this.db
            .from("users_game_data")
            .select(`
            exercise_id,
            quests (
                programming_language_id
            )
            `)
            .eq("user_id", user_id);

        if (error) throw error;

        return data || [];
        }

        async getAllExercises() {
        const { data, error } = await this.db
            .from("quests")
            .select("programming_language_id");

        if (error) throw error;

        return data || [];
        }


    // ONE-TIME USERNAME SETUP
    async setUsernameandCharacter(user_id, username, character_id, full_name) {
        const { data, error } = await this.db
            .from("users")
            .update({ username, character_id, full_name })
            .eq("user_id", user_id)
            .select();
     
        if (error) throw error;
        return data;
    }






    // PROFILE

    async getProfile(user_id) {
        const { data } = await this.db
            .from("users")
            .select("user_id, email, username, full_name, profile_image, character_id, created_at, role")
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

    async updatePassword(email, hashedPassword) {
        const { data, error } = await this.db
            .from("users")
            .update({ password: hashedPassword })
            .eq("email", email)
            .select()
            .maybeSingle();

        if (error) throw error;
        return data;
    }


    async delete(user_id) {
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

