import { supabase } from "../core/supabaseClient.js";

class UserPreferences {
  constructor() {
    this.db = supabase;
  }

  async getByUserId(user_id) {
    if (!user_id) return null;
    const { data, error } = await this.db
      .from("user_preferences")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async ensureRow(user_id) {
    if (!user_id) return null;
    const { data, error } = await this.db
      .from("user_preferences")
      .upsert(
        {
          user_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async setAvatarFrameIfEmpty({ user_id, avatar_frame_key }) {
    if (!user_id || !avatar_frame_key) return null;
    await this.ensureRow(user_id);

    const existing = await this.getByUserId(user_id);
    if (existing?.avatar_frame_key) return existing;

    const { data, error } = await this.db
      .from("user_preferences")
      .update({
        avatar_frame_key,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async setAvatarFrame({ user_id, avatar_frame_key }) {
    if (!user_id) return null;
    await this.ensureRow(user_id);

    const { data, error } = await this.db
      .from("user_preferences")
      .update({
        avatar_frame_key: avatar_frame_key || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async setTerminalSkin({ user_id, terminal_skin_id }) {
    if (!user_id) return null;
    await this.ensureRow(user_id);

    const { data, error } = await this.db
      .from("user_preferences")
      .update({
        terminal_skin_id: terminal_skin_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export default UserPreferences;
