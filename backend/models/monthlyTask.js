import { supabase } from "../core/supabaseClient.js";

class MonthlyTask {
  constructor() {
    this.db = supabase;
  }

  // ── Admin: create a monthly task ─────────────────────────────
  async createTask({
    title,
    description,
    reward_xp,
    reward_badge,
    difficulty,
    language,
    starter_code,
    test_cases,
    solution_code,
    min_xp_required,
    starts_at,
    expires_at,
    created_by,
  }) {
    const { data, error } = await this.db
      .from("monthly_tasks")
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
        expires_at:
          expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

  // ── Admin: update a monthly task ─────────────────────────────
  async updateTask(task_id, fields) {
    const { data, error } = await this.db
      .from("monthly_tasks")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("task_id", task_id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // ── Admin: delete a monthly task ─────────────────────────────
  async deleteTask(task_id) {
    const { error } = await this.db.from("monthly_tasks").delete().eq("task_id", task_id);
    if (error) throw error;
    return true;
  }

  // ── Get all active monthly tasks ─────────────────────────────
  async getActiveTasks() {
    const now = new Date().toISOString();
    const { data, error } = await this.db
      .from("monthly_tasks")
      .select("*")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("expires_at", now)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ── Get all monthly tasks (admin view) ───────────────────────
  async getAllTasks() {
    const { data, error } = await this.db
      .from("monthly_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ── Get user's task progress ─────────────────────────────────
  async getUserTaskProgress(user_id) {
    const { data, error } = await this.db
      .from("user_monthly_tasks")
      .select(`
        *,
        monthly_tasks (*)
      `)
      .eq("user_id", user_id);

    if (error) throw error;
    return data || [];
  }

  async getTaskById(task_id) {
    const { data, error } = await this.db
      .from("monthly_tasks")
      .select("task_id")
      .eq("task_id", task_id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  // ── Accept / start a monthly task ────────────────────────────
  async acceptTask(user_id, task_id) {
    const existing = await this.getTaskById(task_id);
    if (!existing) {
      const err = new Error("Task not found.");
      err.status = 404;
      throw err;
    }

    const { data, error } = await this.db
      .from("user_monthly_tasks")
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

  // ── Complete a monthly task ──────────────────────────────────
  async completeTask(user_id, task_id, xp_awarded) {
    const { data, error } = await this.db
      .from("user_monthly_tasks")
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
}

export default MonthlyTask;
