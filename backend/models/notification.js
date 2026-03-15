import { supabase } from "../core/supabaseClient.js";

class Notification {
  constructor() {
    this.db = supabase;
  }

  normalizeMetadata(row) {
    if (!row) return row;
    const meta = row.metadata;
    if (typeof meta === "string") {
      const trimmed = meta.trim();
      if (trimmed) {
        try {
          row.metadata = JSON.parse(trimmed);
        } catch {
          // ignore
        }
      }
    }
    return row;
  }

  async hasDedupeKey(user_id, dedupe_key, limit = 200) {
    if (!user_id || !dedupe_key) return false;
    const { data, error } = await this.db
      .from("notifications")
      .select("metadata")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    return rows
      .map((r) => this.normalizeMetadata({ ...r }))
      .some((r) => r?.metadata?.dedupe_key === dedupe_key);
  }

  async createOnce({ user_id, type, title, message, metadata, dedupe_key }) {
    if (dedupe_key) {
      const exists = await this.hasDedupeKey(user_id, dedupe_key);
      if (exists) return null;
    }

    const mergedMeta = {
      ...(metadata && typeof metadata === "object" ? metadata : {}),
      ...(dedupe_key ? { dedupe_key } : {}),
    };

    return this.create({
      user_id,
      type,
      title,
      message,
      metadata: mergedMeta,
    });
  }

  // ── Create a notification ────────────────────────────────────
  async create({ user_id, type, title, message, metadata }) {
    const { data, error } = await this.db
      .from("notifications")
      .insert({
        user_id,
        type: type || "general",
        title,
        message,
        is_read: false,
        metadata: metadata || null,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return this.normalizeMetadata(data);
  }

  // ── Get all notifications for a user ─────────────────────────
  async getByUser(user_id, limit = 50) {
    const { data, error } = await this.db
      .from("notifications")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((row) => this.normalizeMetadata(row));
  }

  // ── Get unread count for a user ──────────────────────────────
  async getUnreadCount(user_id) {
    const { count, error } = await this.db
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  }

  // ── Mark a notification as read ──────────────────────────────
  async markAsRead(notification_id, user_id) {
    const { data, error } = await this.db
      .from("notifications")
      .update({ is_read: true })
      .eq("notification_id", notification_id)
      .eq("user_id", user_id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // ── Mark all notifications as read for a user ────────────────
  async markAllAsRead(user_id) {
    const { error } = await this.db
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user_id)
      .eq("is_read", false);

    if (error) throw error;
    return true;
  }

  // ── Delete a notification ────────────────────────────────────
  async deleteNotification(notification_id, user_id) {
    const { error } = await this.db
      .from("notifications")
      .delete()
      .eq("notification_id", notification_id)
      .eq("user_id", user_id);

    if (error) throw error;
    return true;
  }
}

export default Notification;
