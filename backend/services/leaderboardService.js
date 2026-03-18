import UserPreferences from "../models/userPreferences.js";
import Cosmetics from "../models/cosmetics.js";

class LeaderboardService {
    constructor(model) {
        this.model = model;
        this.userPreferences = new UserPreferences();
        this.cosmetics = new Cosmetics();
    }

    async attachAvatarFrames(users) {
        const list = Array.isArray(users) ? users : [];
        if (!list.length) return list;

        const userIds = Array.from(
            new Set(
                list
                    .map((u) => u?.user_id)
                    .map((id) => (id === null || id === undefined ? null : Number(id)))
                    .filter((n) => Number.isFinite(n) && n > 0)
            )
        );
        if (!userIds.length) return list;

        let prefs = [];
        try {
            prefs = await this.userPreferences.getByUserIds(userIds);
        } catch {
            prefs = [];
        }
        const prefByUserId = new Map((prefs || []).map((p) => [Number(p.user_id), p]));

        const frameKeys = Array.from(
            new Set(
                (prefs || [])
                    .map((p) => (p?.avatar_frame_key ? String(p.avatar_frame_key) : ""))
                    .filter(Boolean)
            )
        );

        let frames = [];
        try {
            frames = await this.cosmetics.getByKeys(frameKeys);
        } catch {
            frames = [];
        }
        const frameUrlByKey = new Map(
            (frames || [])
                .filter((c) => c?.key)
                .map((c) => [String(c.key), c?.asset_url ? String(c.asset_url) : null])
        );

        return list.map((u) => {
            const userId = Number(u?.user_id);
            const pref = Number.isFinite(userId) ? prefByUserId.get(userId) : null;
            const key = pref?.avatar_frame_key ? String(pref.avatar_frame_key) : null;
            const url = key ? (frameUrlByKey.get(key) || null) : null;
            return { ...u, avatar_frame_key: key, avatar_frame_url: url };
        });
    }

    async buildGlobalLeaderboard() {
        const questData = await this.model.getQuestXP();
        const quizData = await this.model.getQuizXP();
        const examData = await this.model.getExamXP();

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
                    username: row.users?.username,
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
                    username: row.users?.username,
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

        const latestExamAttemptByUserProblem = new Map();
        examData.forEach((row) => {
            const userId = row.user_id;
            const problemId = row.exam_problem_id;
            if (!userId || !problemId) return;

            const key = `${userId}:${problemId}`;
            const existing = latestExamAttemptByUserProblem.get(key);
            if (!existing || Number(row.id || 0) > Number(existing.id || 0)) {
                latestExamAttemptByUserProblem.set(key, row);
            }
        });

        // Process latest Exam XP per user+problem
        Array.from(latestExamAttemptByUserProblem.values()).forEach(row => {
            if (row.users?.role === "admin") return;

            const userId = row.user_id;
            const xp = Number(row.earned_xp || 0);
            const slug = row.exam_problems?.programming_languages?.slug;

            if (!users[userId]) {
                users[userId] = {
                    user_id: userId,
                    username: row.users?.username,
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

        return await this.attachAvatarFrames(leaderboard);
    }
}

export default LeaderboardService;
