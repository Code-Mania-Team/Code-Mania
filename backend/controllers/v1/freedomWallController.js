import FreedomWall from "../../models/freedomWall.js";

class FreedomWallController {
    constructor() {
        this.post = new FreedomWall();
    }

    // CREATE FREEDOM WALL POST
    async createFreedomWallPost(req, res) {
        const user_id = res.locals.user_id;
        const { content } = req.body || {};
        
        // Get actual username from database, not from JWT token
        const userProfile = await this.post.getUserProfile(user_id);
        const actualUsername = userProfile?.username || res.locals.username;
        
        await this.post.createPost(user_id, content);
        const character_id = await this.post.getCharacterIdByUserId(user_id);
        
        res.send({
            success: true,
            message: "Freedom Wall post created successfully",
            data:{
                user_id: user_id,
                character_id: character_id,
                username: actualUsername, // Use actual username from database
                content: content,
                created_at: new Date().toISOString()
            }
        });
    }
}

export default FreedomWallController;