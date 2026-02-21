import Leaderboard from "../../models/leaderboard.js";
import LeaderboardService from "../../services/leaderboardService.js";

class LeaderboardController {
    constructor() {
        this.model = new Leaderboard();
        this.service = new LeaderboardService(this.model);
    }

    async getLeaderboard(req, res) {
        try {
            const data = await this.service.buildGlobalLeaderboard();

            return res.status(200).json({
                success: true,
                total: data.length,
                data
            });
        } catch (err) {
            console.error("Leaderboard error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch leaderboard"
            });
        }
    }
}

export default LeaderboardController;