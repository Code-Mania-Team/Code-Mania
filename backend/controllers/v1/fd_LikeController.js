import LikePost from '../../models/fd_Likes.js';
import FreedomWall from '../../models/freedomWall.js';

class ReactionController {

    constructor() {
        this.like = new LikePost();
        this.post = new FreedomWall();
    }

    async likePost(req, res) {
        try {

            const { fd_wall_id } = req.params;
            const user_id = res.locals.user_id;

            const result = await this.like.likePost(fd_wall_id, user_id);

            if (result.affectedRows > 0) {
                return res.send({
                    success: true,
                    message: "Post liked successfully.",
                    like_count: result.like_count
                });
            }

            return res.send({
                success: false,
                message: result.message
            });

        } catch (error) {

            console.error('<error> likeThread:', error);

            res.status(500).send({
                success: false,
                message: `Error while liking the post: ${error.message}`
            });

        }
    }




    async unlikePost(req, res) {

        try {

            const { fd_wall_id } = req.params;
            const user_id = res.locals.user_id;

            const post = await this.post.getPostById(fd_wall_id);

            if (!post) {
                return res.status(404).send({
                    success: false,
                    message: 'Post not found.'
                });
            }

            const existingLike = await this.like.hasUserLikedPost(fd_wall_id, user_id);

            if (!existingLike) {
                return res.status(400).send({
                    success: false,
                    message: 'Post not liked by the user.'
                });
            }

            await this.like.unlikePost(fd_wall_id, user_id);

            return res.send({
                success: true,
                message: "Post unliked successfully."
            });

        } catch (error) {

            console.error('<error> unlikeThread:', error);

            res.status(500).send({
                success: false,
                message: `Error while unliking the post: ${error.message}`
            });

        }
    }

    async getAllLike(req, res) {

        try {

            const { fd_wall_id } = req.params;

            const result = await this.like.getwhoLike(fd_wall_id);

            if (result && result.length > 0) {

                return res.send({
                    success: true,
                    message: "Users who liked the post retrieved successfully.",
                    likes: result
                });

            }

            return res.send({
                success: false,
                message: "No users have liked this post yet.",
                likes: []
            });

        } catch (err) {

            res.status(500).send({
                success: false,
                message: err.toString()
            });

        }
    }


    async getLikesCount(req, res) {

        try {

            const { fd_wall_id } = req.params;

            const likesCount = await this.like.getLikeCount(fd_wall_id);

            return res.send({
                success: true,
                message: "Likes count retrieved successfully.",
                likesCount: likesCount
            });

        } catch (err) {

            res.status(500).send({
                success: false,
                message: err.toString()
            });

        }
    }

}


export default ReactionController;
