import { supabase } from "../core/supabaseClient.js";

class GameData {
  constructor() {
    this.db = supabase;
  }

  async getUserGameData(user_id, programming_language_id) {
    // Preferred schema: language is resolved via quests relation
    const { data: joinedData, error: joinedError } = await this.db
      .from("users_game_data")
      .select(`
        exercise_id,
        status,
        quests!inner (
          id,
          experience,
          programming_language_id
        )
        `)
        .eq("user_id", user_id)
        .eq("quests.programming_language_id", programming_language_id);

    if (error) throw error;

    return data || [];
    }

}

export default GameData;
