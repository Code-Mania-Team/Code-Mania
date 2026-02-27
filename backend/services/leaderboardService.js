class LeaderboardService {
    constructor(model) {
        this.model = model;
    }

    async buildGlobalLeaderboard() {
        const questData = await this.model.getQuestXP();
        const quizData = await this.model.getQuizXP();

        const users = {};

        // Process Quest XP
        questData.forEach(row => {
            if (row.users?.role === "admin") return;

            const userId = row.user_id;
            const xp = row.quests?.experience || 0;
            const slug = row.quests?.programming_languages?.slug;

            if (!users[userId]) {
                users[userId] = {
                    user_id: userId,
                    full_name: row.users?.full_name,
                    character_id: row.users?.character_id,
                    overall_xp: 0,
                    python_xp: 0,
                    cpp_xp: 0,
                    javascript_xp: 0
                };
            }

            users[userId].overall_xp += xp;

            if (slug === "python") users[userId].python_xp += xp;
            if (slug === "cpp") users[userId].cpp_xp += xp;
            if (slug === "javascript") users[userId].javascript_xp += xp;
        });

        // Process Quiz XP
        quizData.forEach(row => {
            if (row.users?.role === "admin") return;

            const userId = row.user_id;
            const xp = row.earned_xp || 0;
            const slug = row.quizzes?.programming_languages?.slug;

            if (!users[userId]) {
                users[userId] = {
                    user_id: userId,
                    full_name: row.users?.full_name,
                    character_id: row.users?.character_id,
                    overall_xp: 0,
                    python_xp: 0,
                    cpp_xp: 0,
                    javascript_xp: 0
                };
            }

            users[userId].overall_xp += xp;

            if (slug === "python") users[userId].python_xp += xp;
            if (slug === "cpp") users[userId].cpp_xp += xp;
            if (slug === "javascript") users[userId].javascript_xp += xp;
        });

        // Convert to array
        const leaderboard = Object.values(users);

        // Sort descending by overall XP
        leaderboard.sort((a, b) => b.overall_xp - a.overall_xp);

        // Assign rank
        leaderboard.forEach((user, index) => {
            user.rank = index + 1;
        });

        return leaderboard;
    }
}

export default LeaderboardService;
