import { supabase } from "../core/supabaseClient.js";

class Hashtag {

    constructor() {
        this.db = supabase;
    }

    async listPostHashtagLinksWithHashtag(searchTerm = null) {
        try {
            let query = this.db
                .from("post_hashtags")
                .select(
                    `
                    hashtag_id,
                    hashtags (
                        hashtag_text
                    )
                    `
                );

            if (searchTerm && typeof searchTerm === "string" && searchTerm.trim() !== "") {
                const q = searchTerm.trim();
                query = query.ilike("hashtags.hashtag_text", `%${q}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("<error> listPostHashtagLinksWithHashtag", err);
            throw err;
        }
    }

    async listPostsByHashtag(hashtagText, { limit = 20, offset = 0 } = {}) {
        try {
            const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 50) : 20;
            const safeOffset = Number.isFinite(Number(offset)) ? Math.max(Number(offset), 0) : 0;

            // 1. Fetch matching post IDs with pagination and proper ordering
            const { data: matchingIds, error: matchError } = await this.db
                .from("freedom_wall")
                .select(`
                    fd_wall_id,
                    created_at,
                    post_hashtags!inner (
                        hashtags!inner (
                            hashtag_text
                        )
                    )
                `)
                .eq("post_hashtags.hashtags.hashtag_text", hashtagText)
                .order("created_at", { ascending: false })
                .range(safeOffset, safeOffset + safeLimit - 1);

            if (matchError) throw matchError;

            const postIds = (matchingIds || []).map(r => r.fd_wall_id).filter(Boolean);
            if (postIds.length === 0) return [];

            // 2. Fetch full post data including ALL hashtags for those posts
            const { data: postsData, error: postsError } = await this.db
                .from("freedom_wall")
                .select(`
                    fd_wall_id,
                    content,
                    created_at,
                    users (
                        user_id,
                        username,
                        character_id
                    ),
                    likes (count),
                    post_hashtags (
                        hashtags (
                            hashtag_text
                        )
                    )
                `)
                .in("fd_wall_id", postIds)
                .order("created_at", { ascending: false });

            if (postsError) throw postsError;

            // map it to match what the service expects (returning rows with .freedom_wall)
            // and format post_hashtags array down to just an array of strings
            return (postsData || []).map(post => {
                const hashtags = (post?.post_hashtags || [])
                    .map(l => l?.hashtags?.hashtag_text)
                    .filter(Boolean);
                const { post_hashtags, ...rest } = post;
                return { freedom_wall: { ...rest, hashtags } };
            });

        } catch (err) {
            console.error("<error> listPostsByHashtag", err);
            throw err;
        }
    }

}

export default Hashtag;
