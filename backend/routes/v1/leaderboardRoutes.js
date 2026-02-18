import express from 'express';
import LeaderboardController from '../../controllers/v1/leaderboardController.js';

const leaderboardRouter = express.Router();
const leaderboard = new LeaderboardController();

// Get leaderboard (top users by XP)
leaderboardRouter.get('/', leaderboard.getLeaderboard.bind(leaderboard));

export default leaderboardRouter;
