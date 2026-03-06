import { supabase } from "../core/supabaseClient.js";

class Achievements {
    constructor() {
        this.db = supabase;
    }

    // Get user's completed achievements
    async getUserAchievements(userId) {
        const { data, error } = await this.db
            .from("users_achievements")
            .select(`
            achievement_id,
            created_at,
            achievements (
                id,
                title,
                description,
                badge_key,
                programming_language_id,
                quest_id
            )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data?.map(row => ({
            id: row.achievements?.id,
            title: row.achievements?.title,
            description: row.achievements?.description,
            badge_key: row.achievements?.badge_key,
            programming_language_id: row.achievements?.programming_language_id,
            quest_id: row.achievements?.quest_id,
            earned_at: row.created_at
        })) || [];
        }

    async syncExamCompletionBadges(userId) {
        const { data: passedAttempts, error: attemptsError } = await this.db
            .from("user_exam_attempts")
            .select(`
                exam_problems!inner (
                    programming_language_id
                )
            `)
            .eq("user_id", userId)
            .eq("passed", true);

        if (attemptsError) throw attemptsError;

        const languageIds = Array.from(
            new Set(
                (passedAttempts || [])
                    .map((row) => Number(row?.exam_problems?.programming_language_id))
                    .filter((id) => Number.isFinite(id))
            )
        );

        if (!languageIds.length) return;

        const { data: languages, error: languagesError } = await this.db
            .from("programming_languages")
            .select("id, slug")
            .in("id", languageIds);

        if (languagesError) throw languagesError;

        for (const language of (languages || [])) {
            const slug = String(language?.slug || "").toLowerCase();
            if (!slug) continue;

            const { data: achievement, error: achievementError } = await this.db
                .from("achievements")
                .select("id")
                .eq("programming_language_id", language.id)
                .ilike("badge_key", `%completed-${slug}%`)
                .limit(1)
                .maybeSingle();

            if (achievementError) throw achievementError;
            if (!achievement?.id) continue;

            const { data: existing, error: existingError } = await this.db
                .from("users_achievements")
                .select("achievement_id")
                .eq("user_id", userId)
                .eq("achievement_id", achievement.id)
                .limit(1)
                .maybeSingle();

            if (existingError) throw existingError;
            if (existing) continue;

            const { error: insertError } = await this.db
                .from("users_achievements")
                .insert({
                    user_id: userId,
                    achievement_id: achievement.id
                });

            if (insertError) throw insertError;
        }
    }


    // Mark achievement as completed for user
    async completeAchievement(userId, achievementId) {
        // Check if already completed
        const { data: existing } = await this.db
            .from("users_achievements")
            .select("achievement_id")
            .eq("user_id", userId)
            .eq("achievement_id", achievementId)
            .single();

        if (existing) {
            return { alreadyCompleted: true, data: existing };
        }

        // Insert new achievement record - user can have multiple achievements
        const { data, error } = await this.db
            .from("users_achievements")
            .insert({
                user_id: userId,
                achievement_id: achievementId
            })
            .select()
            .single();

        if (error) throw error;
        return { alreadyCompleted: false, data };
    }

    async getAchievementsByLanguage(languageId) {
        const { data, error } = await this.db
            .from("achievements")
            .select(`
                id,
                title,
                description,
                badge_key,
                programming_language_id,
                quest_id
            `)
            .eq("programming_language_id", languageId)
            .order("quest_id", { ascending: true });

        if (error) throw error;

        return data || [];
    }

    // // Get user's achievement statistics
    // async getUserStats(userId) {
    //     const { data, error } = await this.db
    //         .from("users_achievements")
    //         .select("achievement_id")
    //         .eq("user_id", userId);
        
    //     if (error) throw error;
        
    //     return {
    //         totalCompleted: data ? data.length : 0,
    //         completedIds: data ? data.map(item => item.achievement_id) : []
    //     };
    // }
    
}

export default Achievements;
