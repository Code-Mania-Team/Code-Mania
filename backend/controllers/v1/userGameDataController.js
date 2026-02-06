import GameDataService from "../../services/gameDataService.js";

class UserGameDataController {
    constructor() {
        this.gameDataService = new GameDataService();
    }

    async learningData(req, res) {
        try {
            const user_id = res.locals.user_id;
            const data = await this.gameDataService.getLearningData(user_id);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    async gameData(req, res) {
        try {
            const user_id = res.locals.user_id;
            const { exercise_id, xp_earned, game_id } = req.body || {};

            const data = await this.gameDataService.storeGameData({
                user_id,
                exercise_id,
                xp_earned,
                game_id,
            });

            return res.status(200).json({ success: true, data });
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
