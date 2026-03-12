import { supabase } from "../core/supabaseClient.js";

class Leaderboard {
    constructor() {
        this.db = supabase;
    }

    // 1️⃣ Quest XP (grouped by user + language)
    async getQuestXP() {
        const { data, error } = await this.db
            .from("users_game_data")
            .select(`
                user_id,
                quests (
                    experience,
                    programming_languages (
                        slug
                    )
                ),
                users (
                    username,
                    full_name,
                    character_id,
                    role
                )
            `)
            .eq("status", "completed");

        if (error) throw error;
        return data;
    }

    // 2️⃣ Quiz XP (grouped by user + language)
    async getQuizXP() {
        const { data, error } = await this.db
            .from("user_quiz_attempts")
            .select(`
                user_id,
                earned_xp,
                quizzes (
                    programming_languages (
                        slug
                    )
                ),
                users (
                    username,
                    full_name,
                    character_id,
                    role
                )
            `);

        if (error) throw error;
        return data;
    }

    // 3️⃣ Exam XP (grouped by user + language)
    async getExamXP() {
        const { data, error } = await this.db
            .from("user_exam_attempts")
            .select(`
                id,
                user_id,
                exam_problem_id,
                earned_xp,
                exam_problems (
                    programming_languages (
                        slug
                    )
                ),
                users (
                    username,
                    full_name,
                    character_id,
                    role
                )
            `);

        if (error) throw error;
        return data;
    }
}

export default Leaderboard;
