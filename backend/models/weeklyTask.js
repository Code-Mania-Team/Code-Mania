import { supabase } from "../core/supabaseClient.js";
import { getTotalXpEarned } from "../services/xpService.js";

class WeeklyTask {
  constructor() {
    this.db = supabase;
  }

  // ── Admin: create a weekly task ──────────────────────────────
  async createTask({ title, description, reward_xp, reward_badge, difficulty, language, starter_code, test_cases, solution_code, min_xp_required, starts_at, expires_at, created_by }) {
    const { data, error } = await this.db
      .from("weekly_tasks")
      .insert({
        title,
        description,
        reward_xp: reward_xp ?? 100,
        reward_badge: reward_badge || null,
        difficulty: difficulty || "medium",
        language: language || "javascript",
        starter_code: starter_code || "",
        test_cases: test_cases || [],
        solution_code: solution_code || "",
        min_xp_required: min_xp_required ?? 5000,
        starts_at: starts_at || new Date().toISOString(),
        expires_at: expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // ── Admin: update a weekly task ──────────────────────────────
  async updateTask(task_id, fields) {
    const { data, error } = await this.db
      .from("weekly_tasks")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("task_id", task_id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // ── Admin: delete a weekly task ──────────────────────────────
  async deleteTask(task_id) {
    const { error } = await this.db
      .from("weekly_tasks")
      .delete()
      .eq("task_id", task_id);

    if (error) throw error;
    return true;
  }

  // ── Get all active weekly tasks (for eligible users) ─────────
  async getActiveTasks() {
    const now = new Date().toISOString();
    const { data, error } = await this.db
      .from("weekly_tasks")
      .select("*")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("expires_at", now)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ── Get all weekly tasks (admin view, include inactive) ──────
  async getAllTasks() {
    const { data, error } = await this.db
      .from("weekly_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTaskById(task_id) {
    const { data, error } = await this.db
      .from("weekly_tasks")
      .select("*")
      .eq("task_id", task_id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async getPastTasks({ limit = 30 } = {}) {
    const now = new Date().toISOString();
    const capped = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 200) : 30;

    const { data, error } = await this.db
      .from("weekly_tasks")
      .select("*")
      .lt("expires_at", now)
      .order("expires_at", { ascending: false })
      .limit(capped);

    if (error) throw error;
    return data || [];
  }

  async countParticipants({ taskId }) {
    const { count, error } = await this.db
      .from("user_weekly_tasks")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId);

    if (error) throw error;
    return Number(count || 0);
  }

  async listParticipants({ taskId, limit = 200 } = {}) {
    const capped = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 500) : 200;

    const { data, error } = await this.db
      .from("user_weekly_tasks")
      .select(
        `
        id,
        user_id,
        task_id,
        status,
        completed_at,
        xp_awarded,
        created_at,
        users ( user_id, username, character_id )
      `
      )
      .eq("task_id", taskId)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(capped);

    if (error) throw error;
    return data || [];
  }

  async listWinners({ taskId }) {
    const { data, error } = await this.db
      .from("weekly_task_winners")
      .select(
        `
        id,
        task_id,
        user_id,
        rank,
        note,
        created_at,
        users ( user_id, username, character_id )
      `
      )
      .eq("task_id", taskId)
      .order("rank", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getUsersByUsernames(usernames) {
    const cleaned = Array.from(
      new Set(
        (Array.isArray(usernames) ? usernames : [])
          .map((u) => String(u || "").trim())
          .filter(Boolean)
      )
    );
    if (!cleaned.length) return [];

    const { data, error } = await this.db
      .from("users")
      .select("user_id, username, character_id")
      .in("username", cleaned);

    if (error) throw error;
    return data || [];
  }

  async replaceWinners({ taskId, pickedBy, winners }) {
    // winners: [{ user_id, rank, note }]
    const list = Array.isArray(winners) ? winners : [];

    const { error: delError } = await this.db
      .from("weekly_task_winners")
      .delete()
      .eq("task_id", taskId);
    if (delError) throw delError;

    if (!list.length) return [];

    const insertRows = list
      .map((w) => ({
        task_id: taskId,
        user_id: w.user_id,
        rank: w.rank ?? null,
        note: w.note ?? null,
        picked_by: pickedBy ?? null,
      }))
      .filter((r) => r.user_id);

    if (!insertRows.length) return [];

    const { data, error } = await this.db
      .from("weekly_task_winners")
      .insert(insertRows)
      .select("*");

    if (error) throw error;
    return data || [];
  }

  async getUserWeeklyTaskProgress({ userId, taskId }) {
    const { data, error } = await this.db
      .from("user_weekly_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_id", taskId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  // ── Get user's task progress for active tasks ────────────────
  async getUserTaskProgress(user_id) {
    const { data, error } = await this.db
      .from("user_weekly_tasks")
      .select(`
        *,
        weekly_tasks (*)
      `)
      .eq("user_id", user_id);

    if (error) throw error;
    return data || [];
  }

  // ── Accept / start a weekly task ────────────────────────────
  async acceptTask(user_id, task_id) {
    const { data, error } = await this.db
      .from("user_weekly_tasks")
      .upsert(
        {
          user_id,
          task_id,
          status: "in_progress",
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id,task_id" }
      )
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // ── Complete a weekly task ──────────────────────────────────
  async completeTask(user_id, task_id, xp_awarded) {
    const { data, error } = await this.db
      .from("user_weekly_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        xp_awarded: xp_awarded || 0,
      })
      .eq("user_id", user_id)
      .eq("task_id", task_id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // ── Get user's total XP (to check 5k threshold) ─────────────
  async getUserTotalXp(user_id) {
    return getTotalXpEarned(user_id);
  }

  async addXp(userId, xp) {
    const numeric = Number(xp || 0);
    if (!Number.isFinite(numeric) || numeric === 0) return;
    await this.db.rpc("increment_xp", {
      user_id_input: userId,
      xp_input: numeric,
    });
  }
}

export default WeeklyTask;
