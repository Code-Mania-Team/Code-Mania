import { supabase } from "../core/supabaseClient.js";

class Achievements {
    constructor() {
        this.db = supabase;
    }

    // Get user's completed achievements
    async getUserAchievements(userId) {
        const { data, error } = await this.db
            .from("users_achievements")
            .select("achievement_id, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        
        if (error) throw error;
        return data || [];
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
