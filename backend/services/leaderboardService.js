class LeaderboardService {
    constructor(leaderboardModel) {
        this.leaderboardModel = leaderboardModel;
    }

    async buildLeaderboard(limit = 50) {
        const users = await this.leaderboardModel.getTopUsersWithGameData(limit);

        return users.map((user) => {
            const xpByLanguage = {};

            user.users_game_data?.forEach((gameData) => {
                const quest = gameData.quests;
                if (!quest) return;

                const langId = quest.programming_language_id;
                const langName = quest.programming_languages?.name;
                const xp = quest.experience || 0;

                if (!xpByLanguage[langId]) {
                    xpByLanguage[langId] = {
                        programming_language_id: langId,
                        language_name: langName,
                        total_xp: 0
                    };
                }

                xpByLanguage[langId].total_xp += xp;
            });

            // Calculate total XP for this user
            const totalXP = user.users_game_data?.reduce((sum, gameData) => {
                return sum + (gameData.quests?.experience || 0);
            }, 0) || 0;

            return {
                user_id: user.user_id,
                full_name: user.full_name || "Anonymous",
                overall_xp: totalXP,
                character_id: user.character_id,
                xp_by_language: Object.values(xpByLanguage)
            };
        }).sort((a, b) => b.overall_xp - a.overall_xp);
    }
}

export default LeaderboardService;
