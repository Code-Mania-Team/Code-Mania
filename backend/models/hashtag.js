import { supabase } from "../core/supabaseClient.js";

class Hashtag {

    constructor() {
        this.db = supabase;
    }

    async listPostHashtagLinksWithHashtag() {
        try {
            const { data, error } = await this.db
                .from("post_hashtag")
                .select(
                    `
                    hashtag_id,
                    hashtag:hashtag_id (
                        hashtag_text
                    )
                    `
                );

            if (error) throw error;
            return data;
        } catch (err) {
            console.error("<error> listPostHashtagLinksWithHashtag", err);
            throw err;
        }
    }

}

export default Hashtag;