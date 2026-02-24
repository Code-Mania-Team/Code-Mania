import { supabase } from "../core/supabaseClient.js";

class GameData {
  constructor() {
    this.db = supabase;
  }

  async getUserGameData(user_id, programming_language_id) {
    // Preferred schema: language resolved through quests relation
    const { data: joinedData, error: joinedError } = await this.db
      .from("users_game_data")
      .select(`
        exercise_id,
        quests!inner (
            id,
            experience,
            programming_language_id
        )
        `)
      .eq("user_id", user_id)
      .eq("status", "completed")
      .eq("quests.programming_language_id", programming_language_id);

    if (!joinedError) {
      return joinedData || [];
    }

    // Legacy fallback: language stored directly in users_game_data
    const { data: legacyRows, error: legacyError } = await this.db
      .from("users_game_data")
      .select("exercise_id, xp_earned, programming_language, status")
      .eq("user_id", user_id)
      .eq("programming_language", programming_language_id)
      .eq("status", "completed");

    if (legacyError) throw legacyError;

    return (legacyRows || []).map((row) => ({
      exercise_id: row.exercise_id,
      status: row.status,
      quests: {
        experience: Number(row?.xp_earned || 0),
        programming_language_id,
      },
    }));
  }

}

export default GameData;