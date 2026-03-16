import { supabase } from "../core/supabaseClient.js";

class Search {

    // SEARCH USERS
    async searchUsers(searchTerm) {
        try {

            const { data, error } = await supabase
                .from("users")
                .select(`
                    user_id,
                    username,
                    full_name
                `)
                .ilike("username", `%${searchTerm}%`);

            if (error) throw error;

            return data;

        } catch (err) {
            console.error("<error> searchUsers", err);
            throw err;
        }
    }


    // SEARCH POSTS BY CONTENT
    async searchPosts(searchTerm) {
        try {

            const { data, error } = await supabase
                .from("freedom_wall")
                .select(`
                    fd_wall_id,
                    content,
                    created_at,
                    users (
                        user_id,
                        username
                    ),
                    likes(count)
                `)
                .ilike("content", `%${searchTerm}%`)
                .order("created_at", { ascending: false });

            if (error) throw error;

            return data;

        } catch (err) {
            console.error("<error> searchPosts", err);
            throw err;
        }
    }


    // SEARCH POSTS BY HASHTAG
    async searchPostsWithHashtags(searchTerm) {
        try {

            const { data, error } = await supabase
                .from("post_hashtags")
                .select(`
                    hashtags (
                        hashtag_text
                    ),
                    freedom_wall (
                        fd_wall_id,
                        content,
                        created_at,
                        users (
                            user_id,
                            username
                        ),
                        likes(count)
                    )
                `)
                .ilike("hashtags.hashtag_text", `%${searchTerm}%`)
                .order("created_at", { ascending: false });

            if (error) throw error;

            return data;

        } catch (err) {
            console.error("<error> searchPostsWithHashtags", err);
            throw err;
        }
    }

}

export default Search;