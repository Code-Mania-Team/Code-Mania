import { supabase } from "../core/supabaseClient.js";
import { getTotalXpEarned } from "../services/xpService.js";

class WeeklyTask {
  constructor() {
    this.db = supabase;
  }

  async resolveProgrammingLanguageId({ programming_language_id, language } = {}) {
    const directId = Number(programming_language_id);
    if (Number.isFinite(directId) && directId > 0) return directId;

    const slug = String(language || "javascript").trim().toLowerCase();
    const { data, error } = await this.db
      .from("programming_languages")
      .select("id, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) {
      throw new Error(`Unknown programming language slug: ${slug}`);
    }
    return data.id;
  }

  toApiTask(row) {
    if (!row) return row;
    const pl = row.programming_languages || null;
    const { programming_languages, ...rest } = row;
    // Keep `language` for existing frontend expectations (derived, not stored).
    return {
      ...rest,
      language: pl?.slug || null,
      programming_language: pl ? { id: pl.id, name: pl.name, slug: pl.slug } : null,
    };
  }

  // ── Admin: create a weekly task ──────────────────────────────
  async createTask({ title, description, reward_xp, difficulty, language, programming_language_id, starter_code, test_cases, solution_code, min_xp_required, starts_at, expires_at, created_by, cover_image, reward_avatar_frame_key, reward_terminal_skin_id }) {
    const resolvedLangId = await this.resolveProgrammingLanguageId({ programming_language_id, language });

    const payload = {
      title,
      description,
      reward_xp: reward_xp ?? 100,
      difficulty: difficulty || "medium",
      starter_code: starter_code || "",
      test_cases: test_cases || [],
      solution_code: solution_code || "",
      cover_image: cover_image || null,
      programming_language_id: resolvedLangId,
      min_xp_required: min_xp_required ?? 5000,
      starts_at: starts_at || new Date().toISOString(),
      expires_at: expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      created_by,
      reward_avatar_frame_key: reward_avatar_frame_key || null,
      reward_terminal_skin_id: reward_terminal_skin_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Some environments may not have reward columns yet; retry without them.
    const tryInsert = async (row) => {
      return this.db
        .from("weekly_tasks")
        .insert(row)
        .select("*, programming_languages ( id, name, slug )")
        .maybeSingle();
    };

    let { data, error } = await tryInsert(payload);
    if (error && /reward_(avatar_frame_key|terminal_skin_id)/i.test(String(error.message || ""))) {
      const { reward_avatar_frame_key: _a, reward_terminal_skin_id: _t, ...fallback } = payload;
      ({ data, error } = await tryInsert(fallback));
    }

    if (error) throw error;
    return this.toApiTask(data);
  }

  // ── Admin: update a weekly task ──────────────────────────────
  async updateTask(task_id, fields) {
    const patch = { ...(fields || {}) };

    // Column may not exist anymore (legacy payload).
    if (Object.prototype.hasOwnProperty.call(patch, "reward_badge")) {
      delete patch.reward_badge;
    }

    if (Object.prototype.hasOwnProperty.call(patch, "reward_avatar_frame_key")) {
      patch.reward_avatar_frame_key = patch.reward_avatar_frame_key || null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "reward_terminal_skin_id")) {
      patch.reward_terminal_skin_id = patch.reward_terminal_skin_id || null;
    }

    if (patch.language || patch.programming_language_id) {
      const resolvedLangId = await this.resolveProgrammingLanguageId({
        programming_language_id: patch.programming_language_id,
        language: patch.language,
      });
      patch.programming_language_id = resolvedLangId;
      delete patch.language;
    }

    const { data, error } = await this.db
      .from("weekly_tasks")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("task_id", task_id)
      .select("*, programming_languages ( id, name, slug )")
      .maybeSingle();

    if (error && /reward_(avatar_frame_key|terminal_skin_id)/i.test(String(error.message || ""))) {
      delete patch.reward_avatar_frame_key;
      delete patch.reward_terminal_skin_id;
      const retry = await this.db
        .from("weekly_tasks")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("task_id", task_id)
        .select("*, programming_languages ( id, name, slug )")
        .maybeSingle();
      if (retry.error) throw retry.error;
      return this.toApiTask(retry.data);
    }

    if (error) throw error;
    return this.toApiTask(data);
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
      .select("*, programming_languages ( id, name, slug )")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("expires_at", now)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((r) => this.toApiTask(r));
  }

  // ── Get all weekly tasks (admin view, include inactive) ──────
  async getAllTasks() {
    const { data, error } = await this.db
      .from("weekly_tasks")
      .select("*, programming_languages ( id, name, slug )")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((r) => this.toApiTask(r));
  }

  async getTaskById(task_id) {
    const { data, error } = await this.db
      .from("weekly_tasks")
      .select("*, programming_languages ( id, name, slug )")
      .eq("task_id", task_id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.toApiTask(data) : null;
  }

  async getPastTasks({ limit = 30 } = {}) {
    const now = new Date().toISOString();
    const capped = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 200) : 30;

    const { data, error } = await this.db
      .from("weekly_tasks")
      .select("*, programming_languages ( id, name, slug )")
      .lt("expires_at", now)
      .order("expires_at", { ascending: false })
      .limit(capped);

    if (error) throw error;
    return (data || []).map((r) => this.toApiTask(r));
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
    if (!userId || !taskId) return null;
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
    if (!user_id) return [];
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
    // Only create the row if it doesn't exist.
    // Avoid updating existing rows (e.g. don't overwrite a completed row back to in_progress).
    const { error } = await this.db
      .from("user_weekly_tasks")
      .upsert(
        {
          user_id,
          task_id,
          status: "in_progress",
        },
        { onConflict: "user_id,task_id", ignoreDuplicates: true }
      );

    if (error) throw error;
    return this.getUserWeeklyTaskProgress({ userId: user_id, taskId: task_id });
  }

  // ── Complete a weekly task ──────────────────────────────────
  async completeTask(user_id, task_id, xp_awarded) {
    const existing = await this.getUserWeeklyTaskProgress({ userId: user_id, taskId: task_id });
    if (existing?.status === "completed") return existing;

    const now = new Date().toISOString();
    const numericXp = Number(xp_awarded || 0);

    const { data, error } = await this.db
      .from("user_weekly_tasks")
      .upsert(
        {
          user_id,
          task_id,
          status: "completed",
          completed_at: now,
          xp_awarded: Number.isFinite(numericXp) ? numericXp : 0,
        },
        { onConflict: "user_id,task_id" }
      )
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
