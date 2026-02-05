import GameData from "../models/gameData.js";

class GameDataService {
    constructor() {
        this.gameData = new GameData();
    }

    async getLearningData(user_id) {
        const userGameData = await this.gameData.getUserGameData(user_id);
        return userGameData;
    }

    async storeGameData({ user_id, exercise_id, xp_earned, game_id }) {
        if (!user_id) throw new Error("Unauthorized");
        if (!exercise_id) throw new Error("exercise_id is required");

        const normalizedXpEarned =
            xp_earned === undefined || xp_earned === null || String(xp_earned).trim() === ""
                ? 0
                : Number(xp_earned);

        if (!Number.isFinite(normalizedXpEarned)) {
            throw new Error("xp_earned must be a number");
        }

        const normalizedGameId =
            game_id === undefined || game_id === null || String(game_id).trim() === "" ? null : game_id;

        if (!normalizedGameId) {
            return await this.gameData.createUserGameData({
                user_id,
                xp_earned: normalizedXpEarned,
                exercise_id,
            });
        }

        const updated = await this.gameData.updateUserGameData({
            user_id,
            game_id: normalizedGameId,
            xp_earned: normalizedXpEarned,
            exercise_id,
        });

        return updated;
    }
}

export default GameDataService;
