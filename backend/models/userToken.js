import { supabase } from "../core/supabaseClient.js";
import { generateRefreshToken } from "../utils/token.js";
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
            token: hashedRefreshToken,
            expires_at: expiresAt.toISOString(),
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
        .eq("token", hashedRefreshToken)
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
            token: null,
            expires_at: new Date().toISOString(),
        })
        .eq("token_id", token_id);

        if (error) throw error;
    }

    // Invalidate all tokens for a user (logout everywhere)
    async invalidateByUserId(user_id) {
        const { error } = await this.db
        .from("user_tokens")
        .update({
            token: null,
            expires_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

        if (error) throw error;
    }

    async rotate(oldRefreshToken) {
        const hashedOld = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
        console.log("🔍 Looking for token hash:", hashedOld);
        console.log("🔍 Raw token:", oldRefreshToken);
        const tokenRow = await this.findByRefresh(hashedOld);
        console.log("🔍 Found token row:", tokenRow);

        if (!tokenRow || !tokenRow.user_id || !tokenRow.token) {
            console.log("❌ Token not found or invalid");
            throw new Error('Invalid refresh token');
        }

        const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at) : null;
        if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
            throw new Error('Invalid refresh token');
        }

        const newRefreshToken = generateRefreshToken();
        const hashedNew = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        await this.update(tokenRow.user_id, hashedNew);

        return {
            user_id: tokenRow.user_id,
            refreshToken: newRefreshToken,
        };
    }
}
export default UserToken;