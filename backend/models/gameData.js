import { supabase } from "../core/supabaseClient.js";   

class GameData {
    constructor() {
        this.db = supabase;
    }

    async getUserGameData(user_id) {
        const { data, error } = await this.db
            .from("users_game_data")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async createUserGameData({ user_id, xp_earned, exercise_id }) {
        const { data, error } = await this.db
            .from("users_game_data")
            .insert({
                user_id,
                xp_earned,
                exercise_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select("*")
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async updateUserGameData({ user_id, game_id, xp_earned, exercise_id }) {
        const { data, error } = await this.db
            .from("users_game_data")
            .update({
                xp_earned,
                exercise_id,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", user_id)
            .eq("game_id", game_id)
            .select("*")
            .maybeSingle();

        if (error) throw error;
        return data;
    }
}
export default GameData;