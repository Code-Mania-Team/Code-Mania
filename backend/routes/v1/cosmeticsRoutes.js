import express from "express";
import { authentication } from "../../middlewares/authentication.js";
import CosmeticsController from "../../controllers/v1/cosmeticsController.js";

const cosmeticsRouter = express.Router();
const controller = new CosmeticsController();

cosmeticsRouter.get("/me", authentication, controller.me.bind(controller));
cosmeticsRouter.patch("/preferences", authentication, controller.updatePreferences.bind(controller));

export default cosmeticsRouter;
