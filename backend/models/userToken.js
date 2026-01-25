import { supabase } from "../core/supabaseClient.js";
import crypto from "crypto";


class UserToken {
    constructor() {
        this.db = supabase;
    }
    // create a new user token and store in the database
    async createUserToken(user_id, hashedRefreshToken) {
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); 

        const { data, error } = await this.db
            .from("user_tokens")
            .upsert(
                {
                    user_id: user_id,
                    token: hashedRefreshToken,
                    expires_at: expiresAt.toISOString(),
                    created_at: new Date().toISOString()})
            .select("*")
            .maybeSingle();
        if (error) throw error;
        return data;
    }
    // Find token by user ID
    async findByUserId(user_id) {
        const { data, error } = await this.db
        .from("user_tokens")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .maybeSingle();

        if (error) throw error;

        return data;
    }
    // Update refresh token for a user
    async update(user_id, hashedRefreshToken) {
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

        const { data, error } = await this.db
        .from("user_tokens")
        .update({
            refresh_token: hashedRefreshToken,
            expiry_time: expiresAt.toISOString(),
        })
        .eq("user_id", user_id)
        .select("*")
        .maybeSingle();

        if (error) throw error;

        return data;
    }
     // Find token by refresh token hash
    async findByRefresh(hashedRefreshToken) {
        const { data, error } = await this.db
        .from("user_tokens")
        .select("*")
        .eq("refresh_token", hashedRefreshToken)
        .limit(1)
        .maybeSingle();

        if (error) throw error;

        return data;
    }

    // Invalidate token by token ID
    async invalidate(token_id) {
        const { error } = await this.db
        .from("user_tokens")
        .update({
            refresh_token: null,
            expiry_time: new Date().toISOString(),
        })
        .eq("token_id", token_id);

        if (error) throw error;
    }

    // Invalidate all tokens for a user (logout everywhere)
    async invalidateByUserId(user_id) {
        const { error } = await this.db
        .from("user_tokens")
        .update({
            refresh_token: null,
            expiry_time: new Date().toISOString(),
        })
        .eq("user_id", user_id);

        if (error) throw error;
    }



}
export default UserToken;