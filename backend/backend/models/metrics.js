import { supabase } from "../core/supabaseClient.js";

const QUIZ_ATTEMPTS_SELECT = `
  id,
  user_id,
  score_percentage,
  total_correct,
  total_questions,
  earned_xp,
  completed_at,
  users (
    username,
    full_name,
    email
  ),
  quizzes (
    quiz_title,
    route,
    programming_languages (
      slug
    )
  )
`;

const EXAM_ATTEMPTS_SELECT = `
  id,
  user_id,
  exam_problem_id,
  language,
  score_percentage,
  passed,
  earned_xp,
  attempt_number,
  created_at,
  users (
    username,
    full_name,
    email
  ),
  exam_problems (
    problem_title,
    programming_languages (
      slug
    )
  )
`;

class MetricsModel {
  async countUsersCreatedSince(isoDate) {
    const query = supabase.from("users").select("*", { count: "exact", head: true });
    if (isoDate) query.gte("created_at", isoDate);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  async getUserSignupRowsSince(isoDate) {
    const { data, error } = await supabase
      .from("users")
      .select("created_at")
      .gte("created_at", isoDate);

    if (error) throw error;
    return data || [];
  }

  async getCourseStartRows() {
    const { data, error } = await supabase
      .from("users_game_data")
      .select(`
        user_id,
        quests (
          programming_languages (
            name,
            slug
          )
        )
      `);

    if (error) throw error;
    return data || [];
  }

  async getQuizAttempts({ userId, limit = 2000 }) {
    const query = supabase
      .from("user_quiz_attempts")
      .select(QUIZ_ATTEMPTS_SELECT)
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (userId) query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getExamAttempts({ userId, limit = 3000 }) {
    const query = supabase
      .from("user_exam_attempts")
      .select(EXAM_ATTEMPTS_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

export default MetricsModel;