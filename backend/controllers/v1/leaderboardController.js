import Leaderboard from "../../models/leaderboard.js";
import LeaderboardService from "../../services/leaderboardService.js";

class LeaderboardController {
    constructor() {
        this.leaderboardModel = new Leaderboard();
        this.leaderboardService = new LeaderboardService(this.leaderboardModel);
    }

    async getLeaderboard(req, res) {
        try {
            const limit = 50;

            const leaderboard = await this.leaderboardService.buildLeaderboard(limit);

            return res.status(200).json({
                success: true,
                total_users: leaderboard.length,
                data: leaderboard
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
