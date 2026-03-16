import FreedomWall from "../../models/freedomWall.js";

class FreedomWallController {
    constructor() {
        this.post = new FreedomWall();
    }

    // CREATE FREEDOM WALL POST
    async createFreedomWallPost(req, res) {
        const user_id = res.locals.user_id;
        console.log("Creating Freedom Wall post for user_id:", user_id);
        const { content, hashtags } = req.body || {};

        if (typeof content !== "string" || content.trim() === "") {
            return res.status(400).send({
                success: false,
                message: "Content is required",
            });
        }
        
        // Get actual username from database, not from JWT token
        const userProfile = await this.post.getUserProfile(user_id);
        const actualUsername = userProfile?.username || res.locals.username;
        const character_id = userProfile?.character_id ?? null;

        const { post, hashtags: savedHashtags } = await this.post.createPost(user_id, content, hashtags);
        console.log("Username from database:", actualUsername);
        console.log("Username from JWT:", res.locals.username);
        
        res.send({
            success: true,
            message: "Freedom Wall post created successfully",
            data:{
                user_id: user_id,
                character_id: character_id,
                username: actualUsername, // Use actual username from database
                content: post?.content ?? content,
                hashtags: savedHashtags || [],
                created_at: post?.created_at ?? new Date().toISOString()
            }
        });
    }
}

export default FreedomWallController;
