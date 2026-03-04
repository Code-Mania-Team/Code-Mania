import { supabase } from "../core/supabaseClient.js";

class ExamModel {
  async isAdminUser(userId) {
    if (!userId) return false;

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return false;
    }

    return data?.role === "admin";
  }

  async getLanguageBySlug(slug) {
    const { data, error } = await supabase
      .from("programming_languages")
      .select("id, slug, name")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async listProblems({ languageSlug } = {}) {
    let programmingLanguageId;
    if (languageSlug) {
      const lang = await this.getLanguageBySlug(languageSlug);
      if (!lang?.id) return [];
      programmingLanguageId = lang.id;
    }

    let query = supabase
      .from("exam_problems")
      .select(
        `
        id,
        problem_title,
        problem_description,
        exp,
        programming_language_id,
        created_at,
        updated_at,
        programming_languages ( id, slug, name )
      `
      )
      .order("id", { ascending: true });

    if (programmingLanguageId) {
      query = query.eq("programming_language_id", programmingLanguageId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getProblemById(problemId) {
    const { data, error } = await supabase
      .from("exam_problems")
      .select(
        `
        id,
        problem_title,
        problem_description,
        starting_code,
        test_cases,
        solution,
        exp,
        programming_language_id,
        created_at,
        updated_at,
        programming_languages ( id, slug, name )
      `
      )
      .eq("id", problemId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateProblem(problemId, updateFields) {
    const payload = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("exam_problems")
      .update(payload)
      .eq("id", problemId)
      .select(
        `
        id,
        problem_title,
        problem_description,
        starting_code,
        test_cases,
        solution,
        exp,
        programming_language_id,
        created_at,
        updated_at,
        programming_languages ( id, slug, name )
      `
      )
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getNextAttemptNumber({ userId, problemId }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .select("attempt_number")
      .eq("user_id", userId)
      .eq("exam_problem_id", problemId)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    const last = data?.attempt_number ? Number(data.attempt_number) : 0;
    return last + 1;
  }

  async createAttempt({ userId, problemId, languageSlug, attemptNumber, earnedXp = 0 }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .insert({
        user_id: userId,
        exam_problem_id: problemId,
        language: languageSlug,
        attempt_number: attemptNumber,
        score_percentage: 0,
        passed: false,
        earned_xp: earnedXp,
      })
      .select("id, user_id, exam_problem_id, language, attempt_number, score_percentage, passed, earned_xp, created_at")
      .single();

    if (error) throw error;
    return data;
  }


  async getAttemptById({ attemptId }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async userHasPassedProblem({ userId, problemId }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .select("id")
      .eq("user_id", userId)
      .eq("exam_problem_id", problemId)
      .eq("passed", true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  async updateAttemptFull({
    attemptId,
    scorePercentage,
    passed,
    earnedXp,
    attemptNumber
  }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .update({
        score_percentage: scorePercentage,
        passed,
        earned_xp: earnedXp,
        attempt_number: attemptNumber
      })
      .eq("id", attemptId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async listUserAttempts({ userId, languageSlug, problemId, limit = 50 }) {
    let query = supabase
      .from("user_exam_attempts")
      .select(
        `
        id,
        user_id,
        exam_problem_id,
        language,
        score_percentage,
        passed,
        earned_xp,
        attempt_number,
        created_at,
        exam_problems ( id, problem_title, exp, programming_language_id, programming_languages ( slug, name ) )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (languageSlug) query = query.eq("language", languageSlug);
    if (problemId) query = query.eq("exam_problem_id", problemId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getUserExamStatus({ userId, languageSlug }) {
    // Aggregate attempts for the user; Supabase JS doesn't provide server-side SUM easily without RPC.
    // We'll compute in JS for now.
    const attempts = await this.listUserAttempts({ userId, languageSlug, limit: 500 });
    const passedProblemIds = new Set(
      attempts.filter((a) => a.passed).map((a) => a.exam_problem_id)
    );
    const totalEarnedXp = attempts.reduce(
      (sum, a) => sum + Number(a.earned_xp || 0),
      0
    );

    return {
      passedProblems: passedProblemIds.size,
      totalAttempts: attempts.length,
      totalEarnedXp,
    };
  }

  async getLatestAttempt({ userId, problemId }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_problem_id", problemId)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async resetAttemptForRetake({ attemptId, carryXp }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .update({
        attempt_number: 0,
        score_percentage: 0,
        passed: false,
        earned_xp: Number(carryXp || 0),
      })
      .eq("id", attemptId)
      .select("id, user_id, exam_problem_id, language, attempt_number, score_percentage, passed, earned_xp, created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async getAttemptCountForProblem({ userId, problemId }) {
    const { count, error } = await supabase
      .from("user_exam_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("exam_problem_id", problemId);

    if (error) throw error;
    return Number(count || 0);
  }

  async getBestXpForProblem({ userId, problemId }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .select("earned_xp")
      .eq("user_id", userId)
      .eq("exam_problem_id", problemId)
      .order("earned_xp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.earned_xp || 0;
  }

  async addXp(userId, xp) {
    if (!xp) return;
    await supabase.rpc("increment_xp", {
      user_id_input: userId,
      xp_input: xp,
    });
  }

  async getExamCompletionAchievementId({ languageSlug }) {
    if (!languageSlug) return null;

    const language = await this.getLanguageBySlug(languageSlug);
    if (!language?.id) return null;

    const normalizedSlug = String(languageSlug).toLowerCase();

    const { data, error } = await supabase
      .from("achievements")
      .select("id")
      .eq("programming_language_id", language.id)
      .ilike("badge_key", `%completed-${normalizedSlug}%`)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.id || null;
  }

  async grantAchievementIfMissing({ userId, achievementId }) {
    if (!userId || !achievementId) return false;

    const { data: existing, error: existingError } = await supabase
      .from("users_achievements")
      .select("achievement_id")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return false;

    const { error: insertError } = await supabase
      .from("users_achievements")
      .insert({
        user_id: userId,
        achievement_id: achievementId,
      });

    if (insertError) throw insertError;
    return true;
  }
}

export default ExamModel;
