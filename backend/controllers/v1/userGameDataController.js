import GameDataService from "../../services/gameDataService.js";
import ExerciseModel from "../../models/exercises.js";

class UserGameDataController {
    constructor() {
        this.gameDataService = new GameDataService();
        this.exerciseModel = new ExerciseModel();
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
        const quizRows = await this.gameDataService.getQuizAttemptsByLanguage(
            user_id,
            programming_language_id
        );
        const examRows = await this.gameDataService.getExamAttemptsByLanguage(
            user_id,
            programming_language_id
        );

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

        const latestExamByProblem = new Map();
        (examRows || []).forEach((row) => {
            const key = Number(row?.exam_problem_id);
            if (!Number.isFinite(key)) return;

            const existing = latestExamByProblem.get(key);
            if (!existing || Number(row?.id || 0) > Number(existing?.id || 0)) {
                latestExamByProblem.set(key, row);
            }
        });

        const latestExamRows = Array.from(latestExamByProblem.values());

        const examXpEarned = latestExamRows.reduce(
            (sum, row) => sum + Number(row?.earned_xp || 0),
            0
        );

        const examCompleted = latestExamRows.some((row) => row?.passed === true);

        return res.status(200).json({
            success: true,
            completedQuests: rows.map(r => r.exercise_id),
            xpEarned: questXpEarned + quizXpEarned + examXpEarned,
            questXpEarned,
            quizXpEarned,
            examXpEarned,
            examCompleted,
            availableQuiz: (quizRows || []).length,
            completedQuizStages,
            quests: rows.map(r => ({
            id: r.exercise_id,
            xp: r.quests?.experience || 0
            }))
        });

        } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
        }
    }

    async migrateGuestProgress(req, res) {
        try {
            const user_id = res.locals.user_id;
            if (!user_id) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const programming_language_id = Number(req.body?.programming_language_id);
            const completedQuestIds = Array.isArray(req.body?.completedQuestIds)
                ? req.body.completedQuestIds
                : [];

            if (!Number.isFinite(programming_language_id)) {
                return res.status(400).json({
                    success: false,
                    message: "programming_language_id must be a valid number",
                });
            }

            const normalizedQuestIds = Array.from(new Set(
                completedQuestIds
                    .map((id) => Number(id))
                    .filter((id) => Number.isFinite(id) && id > 0)
            ));

            if (normalizedQuestIds.length === 0) {
                return res.status(200).json({ success: true, migrated: 0, xpAwarded: 0 });
            }

            // Guest migration is only intended for early quests.
            // We validate the quest belongs to the language and is within guest range.
            let migrated = 0;
            let xpAwarded = 0;
            const migratedQuestIds = [];

            for (const questId of normalizedQuestIds) {
                const quest = await this.exerciseModel.getExerciseById(questId);
                if (!quest) continue;
                if (Number(quest.programming_language_id) !== programming_language_id) continue;
                if (Number(quest.order_index) > 2) continue;

                const alreadyCompleted = await this.exerciseModel.isQuestCompleted(user_id, questId);
                if (alreadyCompleted) continue;

                // Ensure a row exists then mark complete.
                await this.exerciseModel.startQuest(user_id, questId);
                await this.exerciseModel.markQuestComplete(user_id, questId);
                await this.exerciseModel.addXp(user_id, Number(quest.experience || 0));

                if (quest.achievements_id) {
                    try {
                        await this.exerciseModel.grantAchievement(user_id, quest.achievements_id);
                    } catch {
                        // ignore duplicate achievement inserts
                    }
                }

                migrated += 1;
                xpAwarded += Number(quest.experience || 0);
                migratedQuestIds.push(questId);
            }

            return res.status(200).json({
                success: true,
                migrated,
                xpAwarded,
                migratedQuestIds,
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}

export default UserGameDataController;
