import { supabase } from "../core/supabaseClient.js";

class Cosmetics {
  constructor() {
    this.db = supabase;
  }

  isMissingColumnError(error) {
    const msg = String(error?.message || "").toLowerCase();
    return (
      /column .* does not exist/.test(msg) ||
      /could not find the '.*' column/.test(msg) ||
      /schema cache/.test(msg)
    );
  }

  async createAvatarFrame({ key, name, asset_url, rarity = "epic", enabled = true } = {}) {
    const now = new Date().toISOString();
    const base = {
      key,
      type: "avatar_frame",
      name,
      asset_url,
      rarity,
      enabled,
    };

    const attempts = [
      { ...base, created_at: now, updated_at: now },
      { ...base, created_at: now },
      base,
    ];

    let lastError = null;
    for (const row of attempts) {
      const { data, error } = await this.db
        .from("cosmetics")
        .insert(row)
        .select("*")
        .maybeSingle();

      if (!error) return data;

      lastError = error;
      if (!this.isMissingColumnError(error)) {
        throw error;
      }
    }

    throw lastError || new Error("Failed to create avatar frame cosmetic");
  }

  async listEnabledByTypes(types) {
    const list = Array.isArray(types) ? types : [];
    const { data, error } = await this.db
      .from("cosmetics")
      .select("*")
      .in("type", list)
      .eq("enabled", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getByKeys(keys) {
    const list = Array.isArray(keys) ? keys : [];
    const cleaned = list.map((k) => String(k)).filter(Boolean);
    if (!cleaned.length) return [];

    const { data, error } = await this.db
      .from("cosmetics")
      .select("*")
      .in("key", cleaned);

    if (error) throw error;
    return data || [];
  }

  async getByKey(key) {
    const cleanedKey = String(key || "").trim();
    if (!cleanedKey) return null;

    const { data, error } = await this.db
      .from("cosmetics")
      .select("*")
      .eq("key", cleanedKey)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async listAll({ type, enabled } = {}) {
    let query = this.db.from("cosmetics").select("*");

    if (typeof type === "string" && type.trim()) {
      query = query.eq("type", type.trim());
    }

    if (typeof enabled === "boolean") {
      query = query.eq("enabled", enabled);
    }

    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async create({ key, type, name, asset_url, rarity = "epic", enabled = true } = {}) {
    const now = new Date().toISOString();
    const base = {
      key,
      type,
      name,
      asset_url,
      rarity,
      enabled,
    };

    const attempts = [
      { ...base, created_at: now, updated_at: now },
      { ...base, created_at: now },
      base,
    ];

    let lastError = null;
    for (const row of attempts) {
      const { data, error } = await this.db
        .from("cosmetics")
        .insert(row)
        .select("*")
        .maybeSingle();

      if (!error) return data;
      lastError = error;

      if (!this.isMissingColumnError(error)) {
        throw error;
      }
    }

    throw lastError || new Error("Failed to create cosmetic");
  }

  async updateByKey(key, patch = {}) {
    const cleanedKey = String(key || "").trim();
    if (!cleanedKey) return null;

    const attempts = [
      { ...patch, updated_at: new Date().toISOString() },
      { ...patch },
    ];

    let lastError = null;
    for (const candidate of attempts) {
      const { data, error } = await this.db
        .from("cosmetics")
        .update(candidate)
        .eq("key", cleanedKey)
        .select("*")
        .maybeSingle();

      if (!error) return data || null;
      lastError = error;

      if (!this.isMissingColumnError(error)) {
        throw error;
      }
    }

    throw lastError || new Error("Failed to update cosmetic");
  }

  async deleteByKey(key) {
    const cleanedKey = String(key || "").trim();
    if (!cleanedKey) return null;

    const { data, error } = await this.db
      .from("cosmetics")
      .delete()
      .eq("key", cleanedKey)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }
}

export default Cosmetics;
