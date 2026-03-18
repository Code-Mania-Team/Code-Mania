import { supabase } from "../core/supabaseClient.js";


class FreedomWall {
    constructor() {
        this.db = supabase;
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

            const { data: post, error } = await this.db
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

            // Best-effort: do not block post creation if hashtag tables are missing.
            if (hashtags.length > 0) {
                try {
                    for (const tag of hashtags) {
                        const hashtagId = await this.insertHashtag(tag);
                        if (!hashtagId) continue;
                        await this.linkHashtagToPost(postId, hashtagId);
                    }
                } catch (tagErr) {
                    console.error("<warn> FreedomWall.createPost hashtag linking failed", tagErr);
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
            const { data, error } = await this.db
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

        const tag = this.normalizeHashtag(hashtag);
        if (!tag) return null;

        try {
            const { data, error } = await this.db
                .from("hashtags")
                .upsert({ hashtag_text: tag }, { onConflict: "hashtag_text" })
                .select("hashtag_id, hashtag_text");

            if (error) throw error;

            const row = Array.isArray(data) ? data[0] : data;
            return row?.hashtag_id ?? null;
        } catch (err) {
            console.error("<error> insertHashtag", err);
            throw err;
        }
    }

    async linkHashtagToPost(fd_wall_id, hashtag_id) {
        const postId = Number(fd_wall_id);
        const hashtagId = Number(hashtag_id);
        if (!Number.isFinite(postId) || postId <= 0) return;
        if (!Number.isFinite(hashtagId) || hashtagId <= 0) return;

        try {
            const { error } = await this.db
                .from("post_hashtags")
                .upsert(
                    { fd_wall_id: postId, hashtag_id: hashtagId },
                    { onConflict: "fd_wall_id,hashtag_id" }
                );

            if (error) throw error;
        } catch (err) {
            console.error("<error> linkHashtagToPost", err);
            throw err;
        }
    }

    async getPost() {
        try{
            const withTagsSelect = `
                fd_wall_id,
                content,
                created_at,
                user_id,
                users (
                    username,
                    character_id
                ),
                post_hashtags (
                    hashtags (
                        hashtag_text
                    )
                )
            `;

            const basicSelect = `
                fd_wall_id,
                content,
                created_at,
                user_id,
                users (
                    username,
                    character_id
                )
            `;

            let data;
            let error;

            ({ data, error } = await this.db
                .from("freedom_wall")
                .select(withTagsSelect)
                .order("created_at", { ascending: false }));

            if (error) {
                // Fallback if relationships aren't available yet.
                const fallback = await this.db
                    .from("freedom_wall")
                    .select(basicSelect)
                    .order("created_at", { ascending: false });
                if (fallback.error) throw fallback.error;
                return fallback.data;
            }

            return (data || []).map((row) => {
                const hashtags = (row?.post_hashtags || [])
                    .map((l) => l?.hashtags?.hashtag_text)
                    .filter(Boolean);
                const { post_hashtags, ...rest } = row || {};
                return { ...rest, hashtags };
            });
        } catch (err) {
                throw new Error('An error occurred while fetching posts. Please try again later.');
            }
        }
    
    async getPostById(post_id) {

        try {

            const withTagsSelect = `
                fd_wall_id,
                content,
                created_at,
                user_id,
                users (
                    username,
                    character_id
                ),
                post_hashtags (
                    hashtags (
                        hashtag_text
                    )
                )
            `;

            const { data, error } = await this.db
                .from("freedom_wall")
                .select(withTagsSelect)
                .eq("fd_wall_id", post_id)
                .maybeSingle();

            if (error) throw error;

            const hashtags = (data?.post_hashtags || [])
                .map((l) => l?.hashtags?.hashtag_text)
                .filter(Boolean);
            const { post_hashtags, ...rest } = data || {};
            return { ...rest, hashtags };

        } catch (err) {

            console.error('<error> ThreadPost.getPostById:', err);
            throw err;

        }

    }

}

export default FreedomWall;
