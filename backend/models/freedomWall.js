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
                            profile_image
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