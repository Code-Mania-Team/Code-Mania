import { supabase } from "../core/supabaseClient.js";

class UserCosmetics {
  constructor() {
    this.db = supabase;
  }

  async unlockOnce({ user_id, cosmetic_key, source_type = "weekly_task", source_id = null }) {
    if (!user_id || !cosmetic_key) return null;

    const basePayload = {
      user_id,
      cosmetic_key,
      source_type,
      source_id,
      unlocked_at: new Date().toISOString(),
    };

    // Some DBs use column name `source` instead of `source_type`.
    let { data, error } = await this.db
      .from("user_cosmetics")
      .upsert(basePayload, { onConflict: "user_id,cosmetic_key" })
      .select("*")
      .maybeSingle();

    if (error && /source_type/i.test(String(error.message || ""))) {
      const fallback = {
        ...basePayload,
        source: basePayload.source_type,
      };
      delete fallback.source_type;

      ({ data, error } = await this.db
        .from("user_cosmetics")
        .upsert(fallback, { onConflict: "user_id,cosmetic_key" })
        .select("*")
        .maybeSingle());
    }

    if (error) throw error;
    return data;
  }
}

export default UserCosmetics;
