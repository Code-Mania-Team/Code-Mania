import express from "express";
import AchievementsController from "../../controllers/v1/achievementsController.js";
import { authentication } from "../../middlewares/authentication.js";
import { authorization } from "../../middlewares/authorization.js";

const achievementsRouter = express.Router();
const achievements = new AchievementsController();
achievementsRouter.use(authorization);



// POST /v1/achievements/post-badge - Post a badge/achievement
achievementsRouter.post("/post-badge", authentication, achievements.postBadge.bind(achievements));

export default achievementsRouter;
