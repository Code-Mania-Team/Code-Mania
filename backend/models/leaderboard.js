import { supabase } from "../core/supabaseClient.js";

class Leaderboard {
    constructor() {
        this.db = supabase;
    }

    // Fetch users with their game data and quests
    async getTopUsersWithGameData(limit = 50) {
        const { data, error } = await this.db
            .from("users")
            .select(`
                user_id,
                full_name,
                character_id,
                users_game_data (
                    quests (
                        programming_language_id,
                        experience,
                        programming_languages (
                            name
                        )
                    )
                )
            `)
            .limit(limit);

        if (error) {
            console.error("Leaderboard DB error:", error);
            throw error;
        }

        return data;
    }
}

export default Leaderboard;
