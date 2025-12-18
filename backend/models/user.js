import { supabase } from "../core/supabaseClient.js";
import { encryptPassword } from "../utils/hash.js";
import { generateOtp, sendOtpEmail } from "../utils/otp.js";

class User {
    constructor() {
        this.db = supabase;
    }

    // STEP 1 → Insert / Update temp_user 
    async createTempUser(email, password) {
        const otp = generateOtp();
        const hashedPassword = encryptPassword(password);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 1000); // 1 mins

        // Check if user already exists
        const existingUser = await this.findByEmail(email);
        if (existingUser.email) throw new Error("email") // return existingUser;  // for signup OTP, user already exists

        console.log("OTP for", email, "is", otp);
        
        
        const { data, error } = await supabase
            .from("temp_user")
            .upsert(
                {
                    email,
                    password: hashedPassword,
                    otp,
                    expiry_time: expiresAt.toISOString(),
                    is_verified: false,
                    created_at: new Date().toISOString()
                },
                { onConflict: ["email"] }
            )
            .select("*")
            .maybeSingle();

        if (error) throw error;

        await sendOtpEmail(email, otp);

        return data;
    }

    // VERIFY OTP
    async verifyOtp(email, otp) {
        const { data: otpEntry, error } = await this.db
            .from("temp_user")
            .select("*")
            .eq("email", email)
            .eq("otp", otp)
            .maybeSingle();
        
            console.log("OTP Entry:", otpEntry);
        if (error) throw error;                 // handle Supabase error
        if (!otpEntry) throw new Error("OTP not found");
        if (otpEntry.is_verified) throw new Error("OTP already used");
        if (new Date(otpEntry.expiry_time) < new Date()) throw new Error("OTP expired");

        // Mark OTP as verified
        await this.db
            .from("temp_user")
            .update({ is_verified: true })
            .eq("temp_user_id", otpEntry.temp_user_id);

        // Create new user if not exists
        const { data: newUser, error: createError } = await this.db
            .from("users")
            .insert({
                email: otpEntry.email,
                password: otpEntry.password
            })
            .select("*")
            .maybeSingle();

        if (createError) throw createError;

        return newUser;
    }

    // Helper: find user by email
    async findByEmail(email) {
        const { data } = await this.db
            .from("users")
            .select("user_id, email, password, username")
            .eq("email", email)
            .maybeSingle();
        return data ?? {};
    }

    //new login function na walang otp
    async verify(email, password) {
        try {
            
            const user = await this.findByEmail(email);
            if (!user.email) throw new Error("Email not registered");

            
            const hashedPassword = encryptPassword(password);
            // if (hashedPassword !== user.password) {
            //     throw new Error("Incorrect password");
            // }

            const { data, error } = await this.db
                .from("users")
                .select("user_id, username, email, full_name, profile_image, created_at")
                .eq("email", email)
                .eq("password", hashedPassword); 

            if (error) throw error;
            // console.log(`USER MODEL LOGIN: ${data}`)

            // if (!data || data.length === 0) {
            //     throw new Error("Invalid username or password");
            // }

            const [result] = data; 
            return result;
        } catch (err) {
            // console.error("<error> user.verify", err);
            throw err;
        }
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
            .select("user_id, email, username, full_name, profile_image, created_at")
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
    async logout() {
        return { message: "cookies removed successfully" };
    }
}

export default User;
