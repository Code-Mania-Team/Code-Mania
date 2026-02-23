import GameDataService from "../../services/gameDataService.js";
import { supabase } from "../../core/supabaseClient.js";

class UserGameDataController {
    constructor() {
        this.gameDataService = new GameDataService();
    }

    async learningData(req, res) {
        try {
        const user_id = res.locals.user_id;

        if (!user_id) {
            return res.status(401).json({
            success: false,
            message: "Unauthorized"
            });
        }

        const programming_language_id = parseInt(
            req.query.programming_language
        );

        console.log("Language requested:", programming_language_id)

        if (!Number.isFinite(programming_language_id)) {
            return res.status(400).json({
            success: false,
            message: "programming_language must be a valid ID"
            });
        }

        const rows = await this.gameDataService.getLearningData(
            user_id,
            programming_language_id
        );
        console.log("Fetched learning data:", rows);

        const { data: quizRows } = await supabase
            .from("user_quiz_attempts")
            .select(`
              id,
              earned_xp,
              quizzes!inner (
                programming_language_id,
                route
              )
            `)
            .eq("user_id", user_id)
            .eq("quizzes.programming_language_id", programming_language_id);

        const completedQuizStages = Array.from(
            new Set(
                (quizRows || [])
                    .map((row) => {
                        const route = row?.quizzes?.route || "";
                        const match = String(route).match(/stage-(\d+)/i);
                        return match ? Number(match[1]) : null;
                    })
                    .filter((value) => Number.isFinite(value) && value > 0)
            )
        ).sort((a, b) => a - b);

        const questXpEarned = rows.reduce(
            (sum, r) => sum + (r.quests?.experience || 0),
            0
        );

        const quizXpEarned = (quizRows || []).reduce(
            (sum, row) => sum + Number(row?.earned_xp || 0),
            0
        );

        return res.status(200).json({
            success: true,
            completedQuests: rows.map(r => r.exercise_id),
            xpEarned: questXpEarned + quizXpEarned,
            questXpEarned,
            quizXpEarned,
            availableQuiz: (quizRows || []).length,
            completedQuizStages,
            quests: rows.map(r => ({
            id: r.exercise_id,
            xp: r.quests?.experience || 0
            }))
        });

        } catch (err) {
        console.error("learningData error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
        }
    }
}

export default UserGameDataController;
