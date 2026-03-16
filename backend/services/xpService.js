import { supabase } from "../core/supabaseClient.js";

async function safeSum(table, userId, column, extraEq = null) {
  try {
    let q = supabase.from(table).select(column).eq("user_id", userId);
    if (extraEq && typeof extraEq === "object") {
      for (const [k, v] of Object.entries(extraEq)) {
        q = q.eq(k, v);
      }
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).reduce((sum, row) => sum + Number(row?.[column] || 0), 0);
  } catch {
    return 0;
  }
}

export async function getTotalXpEarned(userId) {
  if (!userId) return 0;

  // Quest XP (sum experiences for completed quests)
  let questXp = 0;
  try {
    const { data: completedQuests, error } = await supabase
      .from("users_game_data")
      .select(
        `
        exercise_id,
        status,
        quests ( experience )
      `
      )
      .eq("user_id", userId)
      .eq("status", "completed");

    if (error) throw error;
    questXp = (completedQuests || []).reduce(
      (sum, row) => sum + Number(row?.quests?.experience || 0),
      0
    );
  } catch {
    questXp = 0;
  }

  // Quiz XP (sum earned_xp)
  const quizXp = await safeSum("user_quiz_attempts", userId, "earned_xp");

  // Exam XP (sum latest attempt per exam_problem_id)
  let examXp = 0;
  try {
    const { data: examAttempts, error } = await supabase
      .from("user_exam_attempts")
      .select("id, exam_problem_id, earned_xp")
      .eq("user_id", userId);

    if (error) throw error;

    const latestByProblem = new Map();
    (examAttempts || []).forEach((row) => {
      const key = Number(row?.exam_problem_id);
      if (!Number.isFinite(key)) return;
      const existing = latestByProblem.get(key);
      if (!existing || Number(row?.id || 0) > Number(existing?.id || 0)) {
        latestByProblem.set(key, row);
      }
    });

    examXp = Array.from(latestByProblem.values()).reduce(
      (sum, row) => sum + Number(row?.earned_xp || 0),
      0
    );
  } catch {
    examXp = 0;
  }

  // Optional sources (best-effort; tables may not exist everywhere)
  const weeklyXp = await safeSum("user_weekly_tasks", userId, "xp_awarded", { status: "completed" });
  const monthlyXp = await safeSum("user_monthly_tasks", userId, "xp_awarded", { status: "completed" });

  return Number(questXp || 0) + Number(quizXp || 0) + Number(examXp || 0) + Number(weeklyXp || 0) + Number(monthlyXp || 0);
}
