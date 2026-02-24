import express from "express";
import LeaderboardController from "../../controllers/v1/leaderboardController.js";

const router = express.Router();
const controller = new LeaderboardController();

router.get("/", controller.getLeaderboard.bind(controller));

export default router;