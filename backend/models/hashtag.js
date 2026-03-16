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

            const { data, error } = await this.db
                .from("post_hashtags")
                .select(
                    `
                    hashtags (
                        hashtag_text
                    ),
                    freedom_wall (
                        fd_wall_id,
                        content,
                        created_at,
                        users (
                            user_id,
                            username,
                            character_id
                        ),
                        likes(count)
                    )
                    `
                )
                .eq("hashtags.hashtag_text", hashtagText)
                .order("created_at", { ascending: false })
                .range(safeOffset, safeOffset + safeLimit - 1);

            if (error) throw error;
            return data;
        } catch (err) {
            console.error("<error> listPostsByHashtag", err);
            throw err;
        }
    }

}

export default Hashtag;
