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
