import { supabase } from "../core/supabaseClient.js";

class UserCosmetics {
  constructor() {
    this.db = supabase;
  }

  async unlockOnce({ user_id, cosmetic_key, source_type = "weekly_task", source_id = null }) {
    if (!user_id || !cosmetic_key) return null;

    const { data, error } = await this.db
      .from("user_cosmetics")
      .upsert(
        {
          user_id,
          cosmetic_key,
          source_type,
          source_id,
          unlocked_at: new Date().toISOString(),
        },
        { onConflict: "user_id,cosmetic_key" }
      )
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export default UserCosmetics;
