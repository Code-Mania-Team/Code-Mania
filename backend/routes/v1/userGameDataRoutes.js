import express from "express";
import UserGameDataController from "../../controllers/v1/userGameDataController.js";
import { authentication } from "../../middlewares/authentication.js";
import { authorization } from "../../middlewares/authorization.js";
const userGameDataRouter = express.Router();
const controller = new UserGameDataController();
userGameDataRouter.use(authorization);
userGameDataRouter.get(
  "/learning-data",
  authentication,
  controller.learningData.bind(controller),
);
userGameDataRouter.post(
  "/game-data",
  authentication,
  controller.gameData.bind(controller),
);
export default userGameDataRouter;
