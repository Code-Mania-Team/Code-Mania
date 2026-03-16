import { supabase } from "../core/supabaseClient.js";


class FreedomWall {
    constructor() {
        this.fd_wall = supabase;
    }

    normalizeHashtag(raw) {
        if (typeof raw !== "string") return null;
        let t = raw.trim().toLowerCase();
        if (!t) return null;
        if (!t.startsWith("#")) t = `#${t}`;
        if (!/^#[a-z0-9_]{1,50}$/.test(t)) return null;
        return t;
    }

    extractHashtagsFromContent(content) {
        if (typeof content !== "string") return [];
        const matches = content.match(/#[A-Za-z0-9_]+/g);
        return matches || [];
    }

    // CREATE POST + HANDLE HASHTAGS
    async createPost(user_id, content, hashtagsInput = []) {

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

            const contentTags = this.extractHashtagsFromContent(content)
                .map((t) => this.normalizeHashtag(t))
                .filter(Boolean);

            const bodyTags = (Array.isArray(hashtagsInput) ? hashtagsInput : [])
                .map((t) => this.normalizeHashtag(t))
                .filter(Boolean);

            const hashtags = Array.from(new Set([...contentTags, ...bodyTags]));

            if (hashtags.length > 0) {
                for (const tag of hashtags) {
                    const hashtagId = await this.insertHashtag(tag);
                    await this.linkHashtagToPost(postId, hashtagId);
                }
            }

            return { post, hashtags };

        } catch (err) {

            console.error("<error> FreedomWall.createPost", err);
            throw err;

        }

    }

    async getUserProfile(user_id) {
        try {
            const { data, error } = await this.fd_wall
                .from("users")
                .select("user_id, username, character_id")
                .eq("user_id", user_id)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error("<error> getUserProfile", err);
            throw err;
        }
    }

    async getCharacterIdByUserId(user_id) {
        try {
            const profile = await this.getUserProfile(user_id);
            return profile?.character_id ?? null;
        } catch (err) {
            console.error("<error> getCharacterIdByUserId", err);
            throw err;
        }
    }


    // INSERT HASHTAG (IF NOT EXISTS)
    async insertHashtag(hashtag) {

        try {
            const { data, error } = await this.fd_wall
                .from("users")
                .select("username, email")
                .eq("user_id", user_id)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (err) {
            throw new Error("Failed to fetch user profile");
        }
    }

    async getCharacterIdByUserId(user_id) {
        try {
        const { data: userProfile, error } = await this.fd_wall
            .from("users")
            .select("character_id")
            .eq("user_id", user_id)
            .maybeSingle();

        if (error) throw error;

        return userProfile?.character_id ?? null;
        } catch (err) {
        throw new Error("Failed to fetch character ID");
        }
    }

    async getPost() {
        try{
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
                throw new Error('An error occurred while fetching posts. Please try again later.');
            }
        }
    
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

            console.error('<error> ThreadPost.getPostById:', err);
            throw err;

        }

    }

}

export default FreedomWall;
