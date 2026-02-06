import { supabase } from "../core/supabaseClient.js";


class FreedomWall {
    constructor() {
        this.fd_wall = supabase;
    }
    // create FREEDOM WALL POSTS
    
    async createPost(user_id, content) {
        const { data, error } = await this.fd_wall
            .from("freedom_wall")
            .insert({
                user_id,
                content,
                created_at: new Date().toISOString()
            })
            .select("*")
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    async getCharacterIdByUserId(user_id) {
        try {
        const { data: userProfile, error } = await supabase
            .from("users")
            .select("character_id")
            .eq("user_id", user_id)
            .maybeSingle();

        if (error) throw error;

        return userProfile?.character_id ?? null;
        } catch (err) {
        console.error("<error> getCharacterIdByUserId", err);
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
                console.error('<error> FreedomWall.getPost', err);
                throw new Error('An error occurred while fetching posts. Please try again later.');
            }
        }
}

export default FreedomWall;