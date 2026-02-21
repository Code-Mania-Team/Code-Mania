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
      .eq("status", "completed")
      .eq("quests.programming_language_id", programming_language_id);

    if (!joinedError) {
      return joinedData || [];
    }

    // Fallback schema: direct programming_language column on users_game_data
    const { data: legacyData, error: legacyError } = await this.db
      .from("users_game_data")
      .select("exercise_id, xp_earned, programming_language, status")
      .eq("user_id", user_id)
      .eq("programming_language", programming_language_id)
      .eq("status", "completed");

    if (legacyError) throw legacyError;

    return (legacyData || []).map((row) => ({
      exercise_id: row.exercise_id,
      status: row.status,
      quests: {
        experience: row.xp_earned || 0,
        programming_language_id,
      },
    }));
  }

  async createUserGameData({ user_id, xp_earned, exercise_id, programming_language }) {
    const { data, error } = await this.db
      .from("users_game_data")
      .insert({
        user_id,
        xp_earned,
        exercise_id,
        programming_language,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateUserGameData({ user_id, game_id, xp_earned, exercise_id }) {
    const { data, error } = await this.db
      .from("users_game_data")
      .update({ xp_earned, exercise_id })
      .eq("user_id", user_id)
      .eq("game_id", game_id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export default GameData;
