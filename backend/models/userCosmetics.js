import { supabase } from "../core/supabaseClient.js";

class UserCosmetics {
  constructor() {
    this.db = supabase;
  }

  async listKeysByUserId(user_id) {
    if (!user_id) return [];
    const { data, error } = await this.db
      .from("user_cosmetics")
      .select("cosmetic_key")
      .eq("user_id", user_id);

    if (error) throw error;
    return (data || []).map((r) => r?.cosmetic_key).filter(Boolean);
  }

  async listOwnedCosmetics(user_id) {
    if (!user_id) return [];

    // Preferred: FK relationship join user_cosmetics.cosmetic_key -> cosmetics.key
    const joined = await this.db
      .from("user_cosmetics")
      .select("cosmetic_key, unlocked_at, cosmetics:cosmetics(*)")
      .eq("user_id", user_id)
      .order("unlocked_at", { ascending: false });

    if (!joined.error) {
      return (joined.data || [])
        .map((r) => {
          const c = r?.cosmetics;
          if (!c?.key) return null;
          return {
            key: c.key,
            type: c.type,
            name: c.name,
            asset_url: c.asset_url,
            rarity: c.rarity,
            unlocked_at: r.unlocked_at || null,
          };
        })
        .filter(Boolean);
    }

    // Fallback: fetch keys then hydrate via Cosmetics model elsewhere.
    const keys = await this.listKeysByUserId(user_id);
    return keys.map((k) => ({ key: k }));
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
