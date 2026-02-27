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

  async getUserRole(userId) {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data?.role || null;
  }
}

export default QuizModel;
