import { supabase } from "../core/supabaseClient.js";

class ExamModel {
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
      `,
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
      `,
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
      `,
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

  async createAttempt({ userId, problemId, languageSlug, attemptNumber }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .insert({
        user_id: userId,
        exam_problem_id: problemId,
        language: languageSlug,
        attempt_number: attemptNumber,
        score_percentage: 0,
        passed: false,
        earned_xp: 0,
      })
      .select(
        "id, user_id, exam_problem_id, language, attempt_number, score_percentage, passed, earned_xp, created_at",
      )
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
    attemptNumber,
  }) {
    const { data, error } = await supabase
      .from("user_exam_attempts")
      .update({
        score_percentage: scorePercentage,
        passed,
        earned_xp: earnedXp,
        attempt_number: attemptNumber,
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
      `,
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
    const attempts = await this.listUserAttempts({
      userId,
      languageSlug,
      limit: 500,
    });
    const passedProblemIds = new Set(
      attempts.filter((a) => a.passed).map((a) => a.exam_problem_id),
    );
    const totalEarnedXp = attempts.reduce(
      (sum, a) => sum + Number(a.earned_xp || 0),
      0,
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
    if (!xp || xp <= 0) return;
    await supabase.rpc("increment_xp", {
      user_id_input: userId,
      xp_input: xp,
    });
  }
}

export default ExamModel;
