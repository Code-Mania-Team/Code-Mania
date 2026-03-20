import { supabase } from "../core/supabaseClient.js";

class SideQuest {
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

  toApiQuest(row) {
    if (!row) return row;
    const pl = row.programming_languages || null;
    const { programming_languages, ...rest } = row;

    return {
      ...rest,
      language: pl?.slug || null,
      programming_language: pl
        ? { id: pl.id, name: pl.name, slug: pl.slug }
        : null,
    };
  }

  async createQuest({
    tag,
    title,
    description,
    task,
    reward_xp,
    difficulty,
    language,
    programming_language_id,
    starter_code,
    test_cases,
    solution_code,
    min_xp_required,
    starts_at,
    expires_at,
    created_by,
  }) {
    const resolvedLangId = await this.resolveProgrammingLanguageId({
      programming_language_id,
      language,
    });

    const { data, error } = await this.db
      .from("side_quests")
      .insert({
        tag: tag || null,
        title,
        description,
        task: task || null,
        reward_xp: reward_xp ?? 100,
        difficulty: difficulty || "medium",
        programming_language_id: resolvedLangId,
        starter_code: starter_code || "",
        test_cases: test_cases || [],
        solution_code: solution_code || "",
        min_xp_required: min_xp_required ?? 0,
        starts_at: starts_at || new Date().toISOString(),
        expires_at:
          expires_at ||
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*, programming_languages ( id, name, slug )")
      .maybeSingle();

    if (error) throw error;
    return this.toApiQuest(data);
  }

  async updateQuest(quest_id, fields) {
    const patch = { ...(fields || {}) };
    delete patch.quest_id;
    delete patch.created_at;
    delete patch.created_by;

    if (patch.language || patch.programming_language_id) {
      const resolvedLangId = await this.resolveProgrammingLanguageId({
        programming_language_id: patch.programming_language_id,
        language: patch.language,
      });
      patch.programming_language_id = resolvedLangId;
      delete patch.language;
    }

    const { data, error } = await this.db
      .from("side_quests")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("quest_id", quest_id)
      .select("*, programming_languages ( id, name, slug )")
      .maybeSingle();

    if (error) throw error;
    return this.toApiQuest(data);
  }

  async deleteQuest(quest_id) {
    const { error } = await this.db
      .from("side_quests")
      .delete()
      .eq("quest_id", quest_id);

    if (error) throw error;
    return true;
  }

  async getActiveQuests({ programming_language_id, language } = {}) {
    const now = new Date().toISOString();
    let query = this.db
      .from("side_quests")
      .select("*, programming_languages ( id, name, slug )")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("expires_at", now)
      .order("created_at", { ascending: false });

    const langId = Number(programming_language_id);
    if (Number.isFinite(langId) && langId > 0) {
      query = query.eq("programming_language_id", langId);
    } else {
      const slug = String(language || "").trim().toLowerCase();
      if (slug) {
        query = query.eq("programming_languages.slug", slug);
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((r) => this.toApiQuest(r));
  }

  async getAllQuests() {
    const { data, error } = await this.db
      .from("side_quests")
      .select("*, programming_languages ( id, name, slug )")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((r) => this.toApiQuest(r));
  }

  async getQuestById(quest_id) {
    const { data, error } = await this.db
      .from("side_quests")
      .select("*, programming_languages ( id, name, slug )")
      .eq("quest_id", quest_id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.toApiQuest(data) : null;
  }

  async getUserSideQuestProgress({ userId, questId }) {
    if (!userId || !questId) return null;

    const { data, error } = await this.db
      .from("user_side_quests")
      .select("*")
      .eq("user_id", userId)
      .eq("quest_id", questId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async getUserQuestProgress(user_id) {
    if (!user_id) return [];

    const { data, error } = await this.db
      .from("user_side_quests")
      .select("*, side_quests (*)")
      .eq("user_id", user_id);

    if (error) throw error;
    return data || [];
  }

  async resolveActorUserId({ user_id, email, username } = {}) {
    const directId = Number(user_id);
    if (Number.isFinite(directId) && directId > 0) return directId;

    if (email) {
      const { data, error } = await this.db
        .from("users")
        .select("user_id")
        .eq("email", String(email).trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;
      const resolved = Number(data?.user_id);
      if (Number.isFinite(resolved) && resolved > 0) return resolved;
    }

    if (username) {
      const { data, error } = await this.db
        .from("users")
        .select("user_id")
        .eq("username", String(username).trim())
        .maybeSingle();

      if (error) throw error;
      const resolved = Number(data?.user_id);
      if (Number.isFinite(resolved) && resolved > 0) return resolved;
    }

    return null;
  }

  async acceptQuest(user_id, quest_id) {
    const existing = await this.getUserSideQuestProgress({ userId: user_id, questId: quest_id });
    if (existing?.status === "completed") {
      return existing;
    }

    const { error } = await this.db.from("user_side_quests").upsert(
      {
        user_id,
        quest_id,
        status: "in_progress",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,quest_id", ignoreDuplicates: true }
    );

    if (error) throw error;
    return this.getUserSideQuestProgress({ userId: user_id, questId: quest_id });
  }

  async completeQuest(user_id, quest_id, xp_awarded) {
    const existing = await this.getUserSideQuestProgress({
      userId: user_id,
      questId: quest_id,
    });

    if (existing?.status === "completed") return existing;
    if (!existing) {
      throw new Error("Side quest must be accepted before completion.");
    }

    const now = new Date().toISOString();
    const numericXp = Number(xp_awarded || 0);

    const { data, error } = await this.db
      .from("user_side_quests")
      .upsert(
        {
          user_id,
          quest_id,
          status: "completed",
          completed_at: now,
          xp_awarded: Number.isFinite(numericXp) ? numericXp : 0,
          updated_at: now,
        },
        { onConflict: "user_id,quest_id" }
      )
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export default SideQuest;
