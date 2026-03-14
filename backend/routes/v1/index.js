import { Router } from "express";

import accountRouter from "./accountRoutes.js";

import passport from "passport";

import freedomWallRouter from "./freedomWallRoutes.js";

import homeRouter from "./homeRoutes.js";

import refreshRouter from "./refreshRoute.js";

import userGameDataRouter from "./userGameDataRoutes.js";

import leaderboardRouter from "./leaderboardRoutes.js";

import adminRouter from "./adminRoutes.js";

import metricsRouter from "./metricsRoutes.js";

import forgotPasswordRouter from "./forgotPasswordRoutes.js";

import achievementsRouter from "./achievementsRoutes.js";

import quizRouter from "./quizRoutes.js";

import { publicExerciseRouter } from "./exercisesRoutes.js";

import domRouter from './domRoutes.js';

import examRouter from "./examRoutes.js";

import fd_LikesRouter from "./fd_LikeRoutes.js";

const v1 = new Router();

v1.use("/post", fd_LikesRouter)

v1.use('/dom', domRouter);

v1.use('/account', accountRouter);

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

v1.get(
  "/login/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

v1.get(
  "/login/google/redirect",
  passport.authenticate("google"),
  (req, res) => {
    res.send("Redirected.");
  },
);


export default v1;
