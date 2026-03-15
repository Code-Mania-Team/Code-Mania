import { supabase } from "../core/supabaseClient.js";

class QuizModel {
  async getLanguageBySlug(slug) {
    const { data, error } = await supabase
      .from("programming_languages")
      .select("id")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  }

  async getQuizByLanguageAndStage({ programmingLanguageId, stageNumber, select = "*" }) {
    const { data, error } = await supabase
      .from("quizzes")
      .select(select)
      .eq("programming_language_id", programmingLanguageId)
      .ilike("route", `%stage-${stageNumber}`)
      .single();

    if (error) throw error;
    return data;
  }

  async getQuestionsByQuizId(quizId) {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId);

    if (error) throw error;
    return data || [];
  }

  async createAttempt({ userId, quizId, scorePercentage, totalCorrect, totalQuestions, earnedXp }) {
    const { error } = await supabase.from("user_quiz_attempts").insert({
      user_id: userId,
      quiz_id: quizId,
      score_percentage: scorePercentage,
      total_correct: totalCorrect,
      total_questions: totalQuestions,
      earned_xp: earnedXp,
    });

    if (error) throw error;
  }

  async hasUserAttempt({ userId, quizId }) {
    if (!userId || !quizId) return false;
    const { data, error } = await supabase
      .from("user_quiz_attempts")
      .select("id")
      .eq("user_id", userId)
      .eq("quiz_id", quizId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data?.id);
  }

  async listUserAttempts({ userId, limit = 50 }) {
    const query = supabase
      .from("user_quiz_attempts")
      .select(
        `
        id,
        user_id,
        quiz_id,
        score_percentage,
        total_correct,
        total_questions,
        earned_xp,
        completed_at,
        quizzes ( quiz_title, route, programming_languages ( slug, name ) )
      `
      )
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getUserRole(userId) {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data?.role || null;
  }

  // ---------------- ADMIN ----------------
  async listQuizzes({ languageSlug } = {}) {
    let programmingLanguageId;
    if (languageSlug) {
      const { data: lang, error: langError } = await supabase
        .from("programming_languages")
        .select("id")
        .eq("slug", String(languageSlug).toLowerCase())
        .maybeSingle();

      if (langError) throw langError;
      if (!lang?.id) return [];
      programmingLanguageId = lang.id;
    }

    let query = supabase
      .from("quizzes")
      .select(
        `
        id,
        programming_language_id,
        title,
        route,
        quiz_title,
        quiz_description,
        quiz_type,
        exp_total,
        created_at,
        updated_at,
        programming_languages ( id, slug, name )
      `
      )
      .order("programming_language_id", { ascending: true })
      .order("id", { ascending: true });

    if (programmingLanguageId) {
      query = query.eq("programming_language_id", programmingLanguageId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getQuizById(quizId) {
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        programming_language_id,
        title,
        route,
        quiz_title,
        quiz_description,
        quiz_type,
        code_prompt,
        starting_code,
        test_cases,
        exp_total,
        created_at,
        updated_at,
        programming_languages ( id, slug, name )
      `
      )
      .eq("id", quizId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateQuiz(quizId, updateFields) {
    const payload = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("quizzes")
      .update(payload)
      .eq("id", quizId)
      .select(
        `
        id,
        programming_language_id,
        title,
        route,
        quiz_title,
        quiz_description,
        quiz_type,
        code_prompt,
        starting_code,
        test_cases,
        exp_total,
        created_at,
        updated_at,
        programming_languages ( id, slug, name )
      `
      )
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export default QuizModel;
