import { supabase } from "../core/supabaseClient.js";

class LikePost {
    constructor() {
        this.like = supabase;
    }

    async hasUserLikedPost(fd_wall_id, user_id) {
        const { data, error } = await this.like
            .from("likes")
            .select("*")
            .eq("fd_wall_id", fd_wall_id)
            .eq("user_id", user_id)
            .maybeSingle();

        if (error) throw error;

        return !!data;
    }


    async likePost(fd_wall_id, user_id) {

        const alreadyLiked = await this.hasUserLikedPost(fd_wall_id, user_id);

        if (alreadyLiked) {
            return {
                affectedRows: 0,
                message: "User has already liked this post."
            };
        }

        const { data: insertData, error: insertError } = await this.like
            .from("likes")
            .insert([{ fd_wall_id, user_id }])
            .select();

        if (insertError) throw insertError;

        const { count, error: countError } = await this.like
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("fd_wall_id", fd_wall_id);

        if (countError) throw countError;

        return {
            affectedRows: insertData.length,
            like_count: count,
            message: "Post liked successfully."
        };
    }

    async unlikePost(fd_wall_id, user_id) {

        const { data, error } = await this.like
            .from("likes")
            .delete()
            .eq("fd_wall_id", fd_wall_id)
            .eq("user_id", user_id);

        if (error) throw error;

        return data;
    }


    async findOne({ fd_wall_id, user_id }) {

        const { data, error } = await this.like
            .from("likes")
            .select("*")
            .eq("fd_wall_id", fd_wall_id)
            .eq("user_id", user_id)
            .maybeSingle();

        if (error) throw error;

        return data;
    }


    async getLikeCount(fd_wall_id) {

        const { count, error } = await this.like
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("fd_wall_id", fd_wall_id);

        if (error) throw error;

        return count;
    }


    async getwhoLike(fd_wall_id) {

        const { data, error } = await this.like
            .from("likes")
            .select(`
                user_id,
                users (
                    user_id,
                    username
                )
            `)
            .eq("fd_wall_id", fd_wall_id);

        if (error) throw error;


        return data;
    }

}

export default LikePost;
