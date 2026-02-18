import GameData from "../models/gameData.js";

class GameDataService {
    constructor() {
        this.gameData = new GameData();
    }

    async getLearningData(user_id, programming_language_id) {
        if (!programming_language_id) {
        throw new Error("programming_language_id is required");
        }

        const data = await this.gameData.getUserGameData(
        user_id,
        programming_language_id
        );

        return data;
    }
}

export default GameDataService;
