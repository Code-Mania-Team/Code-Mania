import { supabase } from "../core/supabaseClient.js";

class Cosmetics {
  constructor() {
    this.db = supabase;
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
}

export default Cosmetics;
