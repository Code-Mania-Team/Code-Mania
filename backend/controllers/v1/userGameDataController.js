import GameDataService from "../../services/gameDataService.js";

class UserGameDataController {
    constructor() {
        this.gameDataService = new GameDataService();
    }

    async learningData(req, res) {
        try {
            const user_id = res.locals.user_id;

            const programming_language =
            req.query.programming_language;

            if (!programming_language) {
            return res.status(400).json({
                success: false,
                message: "programming_language is required",
            });
            }

            let rows = await this.gameDataService.getLearningData(
            user_id,
            programming_language
            );

            if (!Array.isArray(rows)) {
            rows = rows ? [rows] : [];
            }

            return res.status(200).json({
            success: true,
            completedQuests: rows.map(r => r.exercise_id),
            xpEarned: rows.reduce(
                (sum, r) => sum + (r.xp_earned || 0),
                0
            ),
            });
        } catch (err) {
            return res.status(500).json({
            success: false,
            message: err.message,
            });
        }
    }


    async gameData(req, res) {
        try {
            console.log("🔥 gameData HIT");
            console.log("HEADERS:", req.headers);
            console.log("BODY:", req.body);
            console.log("USER_ID:", res.locals.user_id);
            const user_id = res.locals.user_id;
            const { exercise_id, xp_earned, programming_language } = req.body || {};

            const result = await this.gameDataService.storeGameData({
                user_id,
                exercise_id,
                xp_earned,
                programming_language,
            });

            if (result?.alreadyCompleted) {
            return res.status(200).json({
                success: true,
                alreadyCompleted: true,
            });
            }

            return res.status(200).json({ success: true });
        } catch (err) {
            if (err.message === "Unauthorized") {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            if (err.message === "exercise_id is required") {
                return res.status(400).json({ success: false, message: "exercise_id is required" });
            }
            if (err.message === "xp_earned must be a number") {
                return res.status(400).json({ success: false, message: "xp_earned must be a number" });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}

export default UserGameDataController;
