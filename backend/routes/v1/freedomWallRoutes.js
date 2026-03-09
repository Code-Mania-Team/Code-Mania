import express from 'express';
import FreedomWallController from '../../controllers/v1/freedomWallController.js';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const freedomWallRouter = express.Router();
const freedomPost = new FreedomWallController();

// Optional: protect some routes with authorization middleware
// freedomWallRouter.use(authorization);

freedomWallRouter.post('/', authLimiter(), authentication, freedomPost.createFreedomWallPost.bind(freedomPost));


export default freedomWallRouter;
