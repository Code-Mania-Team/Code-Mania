import { supabase } from "../core/supabaseClient.js";

class FreedomWall {

    constructor() {
        this.fd_wall = supabase;
    }

    // CREATE POST + HANDLE HASHTAGS
    async createPost(user_id, content) {

        try {

            const { data: post, error } = await this.fd_wall
                .from("freedom_wall")
                .insert({
                    user_id,
                    content,
                    created_at: new Date().toISOString()
                })
                .select("*")
                .maybeSingle();

            if (error) throw error;

            const postId = post.fd_wall_id;

            // extract hashtags
            const hashtags = content.match(/#\w+/g);

            if (hashtags && hashtags.length > 0) {

                for (let tag of hashtags) {

                    const cleanTag = tag.toLowerCase().trim();

                    const hashtagId = await this.insertHashtag(cleanTag);

                    await this.linkHashtagToPost(postId, hashtagId);

                }

            }

            return post;

        } catch (err) {

            console.error("<error> FreedomWall.createPost", err);
            throw err;

        }

    }


    // INSERT HASHTAG (IF NOT EXISTS)
    async insertHashtag(hashtag) {

        try {

            const { data: existing, error: findError } = await this.fd_wall
                .from("hashtags")
                .select("hashtag_id")
                .eq("hashtag_text", hashtag)
                .maybeSingle();

            if (findError) throw findError;

            if (existing) {
                return existing.hashtag_id;
            }

            const { data, error } = await this.fd_wall
                .from("hashtags")
                .insert({
                    hashtag_text: hashtag
                })
                .select("hashtag_id")
                .maybeSingle();

            if (error) throw error;

            return data.hashtag_id;

        } catch (err) {

            console.error("<error> insertHashtag", err);
            throw err;

        }

    }


    // LINK POST TO HASHTAG
    async linkHashtagToPost(fd_wall_id, hashtag_id) {

        try {

            const { error } = await this.fd_wall
                .from("post_hashtags")
                .insert({
                    fd_wall_id,
                    hashtag_id
                });

            if (error) throw error;

        } catch (err) {

            console.error("<error> linkHashtagToPost", err);
            throw err;

        }

    }


    // REMOVE HASHTAGS FROM POST
    async removePostHashtags(fd_wall_id) {

        try {

            const { error } = await this.fd_wall
                .from("post_hashtags")
                .delete()
                .eq("fd_wall_id", fd_wall_id);

            if (error) throw error;

        } catch (err) {

            console.error("<error> removePostHashtags", err);
            throw err;

        }

    }


    // GET POSTS
    async getPost() {

        try {

            const { data, error } = await this.fd_wall
                .from("freedom_wall")
                .select(`
                    fd_wall_id,
                    content,
                    created_at,
                    user_id,
                    users (
                        username,
                        character_id
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            return data;

        } catch (err) {

            throw new Error("An error occurred while fetching posts.");

        }

    }


    // GET POST BY ID
    async getPostById(post_id) {

        try {

            const { data, error } = await this.fd_wall
                .from("freedom_wall")
                .select("*")
                .eq("fd_wall_id", post_id)
                .maybeSingle();

            if (error) throw error;

            return data;

        } catch (err) {

            console.error("<error> getPostById:", err);
            throw err;

        }

    }


    // GET TRENDING HASHTAGS
    async getTopHashtags(limit = 10) {

        try {

            const { data, error } = await this.fd_wall
                .from("post_hashtags")
                .select(`
                    hashtag_id,
                    hashtags (
                        hashtag_text
                    )
                `)
                .limit(limit);

            if (error) throw error;

            return data;

        } catch (err) {

            console.error("<error> getTopHashtags:", err);
            throw err;

        }

    }

}

export default FreedomWall;