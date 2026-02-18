import User from "../../models/user.js";
import Leaderboard from "../../models/leaderboard.js";

class LeaderboardController {
    constructor() {
        this.user = new User();
        this.leaderboard = new Leaderboard();
    }

    async getLeaderboard(req, res) {
        try {
            // Get top users by overall XP
            const topUsers = await this.user.getTopUsersByXP(50); // Top 50 users
            
            // Get XP per programming language for each user
            const leaderboard = await Promise.all(
                topUsers.map(async (user) => {
                    const xpByLanguage = await this.leaderboard.getXPByProgrammingLanguage(user.user_id);
                    
                    return {
                        user_id: user.user_id,
                        full_name: user.full_name || 'Anonymous',
                        overall_xp: user.overall_xp_points || 0,
                        character_id: user.character_id,
                        xp_by_language: xpByLanguage
                    };
                })
            );

            return res.status(200).json({
                success: true,
                data: leaderboard,
                total_users: leaderboard.length
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
