import { Router } from "express";
import accountRouter from "./accountRoutes.js";
import freedomWallRouter from "./freedomWallRoutes.js";
import homeRouter from "./homeRoutes.js";
import refreshRouter from "./refreshRoute.js";
import userGameDataRouter from "./userGameDataRoutes.js";
import adminRouter from "./adminRoutes.js";
import metricsRouter from "./metricsRoutes.js";
import forgotPasswordRouter from "./forgotPasswordRoutes.js";
import achievementsRouter from "./achievementsRoutes.js";
import quizRouter from "./quizRoutes.js";
import { publicExerciseRouter } from "./exercisesRoutes.js";
import leaderboardRouter from "./leaderboardRoutes.js";
import examRouter from "./examRoutes.js";

const v1 = new Router();

v1.use("/account", accountRouter);
v1.use("/", homeRouter);
v1.use("/leaderboard", leaderboardRouter);
v1.use("/exam", examRouter);
v1.use("/game", userGameDataRouter);
v1.use("/freedom-wall", freedomWallRouter);
v1.use("/refresh", refreshRouter);
v1.use("/admin", adminRouter);
v1.use("/metrics", metricsRouter);
v1.use("/forgot-password", forgotPasswordRouter);
v1.use("/achievements", achievementsRouter);
v1.use("/quizzes", quizRouter);
v1.use("/", publicExerciseRouter);

export default v1;
