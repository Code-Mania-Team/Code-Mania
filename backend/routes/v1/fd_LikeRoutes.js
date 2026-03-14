import express from 'express';
import FreedomWallController from '../../controllers/v1/freedomWallController.js';
import LikePost from '../../controllers/v1/fd_LikeController.js';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const fd_LikesRouter = express.Router();
const likeController = new LikePost();


fd_LikesRouter.post(
    "/:fd_wall_id/like",
    authentication,
    /*authorization,*/
    likeController.likePost.bind(likeController)
);

fd_LikesRouter.delete(
    "/:fd_wall_id/unlike",
    authentication,
    /*authorization,*/
    likeController.unlikePost.bind(likeController)
);

fd_LikesRouter.get(
    "/:fd_wall_id/likes",
    likeController.getAllLike.bind(likeController)
);

fd_LikesRouter.get(
    "/:fd_wall_id/likes/count",
    likeController.getLikesCount.bind(likeController)
);

export default fd_LikesRouter;
