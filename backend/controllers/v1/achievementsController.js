import Achievements from "../../models/achievements.js";

class AchievementsController {
    constructor() {
        this.achievements = new Achievements();
    }

    async getAchievements(req, res){
        try {
            const userId = res.locals.user_id;
            if (!userId) {
                return res.status(401).json({ 
                    success: false, 
                    message: "User not authenticated" 
                });
            }
            const achievements = await this.achievements.getUserAchievements(userId);
            console.log("User achievements retrieved:", achievements);
            res.status(200).json({ 
                success: true, 
                message: "Achievements retrieved successfully", 
                data: achievements 
            });
        } catch (error) {
            console.error("getAchievements error:", error);
            return res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
    // Post a badge/achievement for a user
    async postBadge(req, res) {
        try {
            const userId = res.locals.user_id;
            const { id: achievementId } = req.body;

            if (!userId) {
                return res.status(401).json({ 
                    success: false, 
                    message: "User not authenticated" 
                });
            }

            if (!achievementId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Achievement ID is required" 
                });
            }
            // Complete achievement
            const result = await this.achievements.completeAchievement(userId, achievementId);

            if (result.alreadyCompleted) {
                return res.status(200).json({
                    success: true,
                    message: "Badge already earned",
                    data: {
                        achievementId,
                        alreadyCompleted: true
                    }
                });
            }

            res.status(201).json({
                success: true,
                message: "Badge earned successfully!",
                data: {
                    achievementId,
                    earnedAt: result.data.created_at
                }
            });

        } catch (error) {
            console.error("Error posting badge:", error);
            res.status(500).json({ 
                success: false, 
                message: "Failed to post badge" 
            });
        }
    }
    async getCourseBadges(req, res) {
        try {
            const { languageId } = req.params;

            if (!languageId) {
                return res.status(400).json({
                    success: false,
                    message: "Language ID is required"
                });
            }

            const badges = await this.achievements
                .getAchievementsByLanguage(Number(languageId));

            res.status(200).json({
                success: true,
                data: badges
            });

        } catch (error) {
            console.error("getCourseBadges error:", error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default AchievementsController;
