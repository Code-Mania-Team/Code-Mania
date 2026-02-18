import { supabase } from "../core/supabaseClient.js";   

class Leaderboard {
    constructor() {
        this.db = supabase;
    }

    async getUserGameData(user_id, programming_language) {
        const { data, error } = await this.db
            .from("users_game_data")
            .select("exercise_id, xp_earned, programming_language")
            .eq("user_id", user_id)
            .eq("programming_language", programming_language);

        if (error) throw error;
        return data;
        }


    

    async getXPByProgrammingLanguage(user_id) {
        // Get user's game data with XP and programming language
        const { data, error } = await this.db
            .from("users_game_data")
            .select(`
                xp_earned,
                programming_language
            `)
            .eq("user_id", user_id);

        if (error) throw error;
        
        // Group XP by programming language
        const xpByLanguage = {};
        (data || []).forEach(item => {
            const lang = item.programming_language || 'Unknown';
            const xp = item.xp_earned || 0;
            if (!xpByLanguage[lang]) {
                xpByLanguage[lang] = 0;
            }
            xpByLanguage[lang] += xp;
        });

        return xpByLanguage;
    }
}
export default Leaderboard;