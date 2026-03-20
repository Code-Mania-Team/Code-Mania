import express from "express";
import SideQuestController from "../../controllers/v1/sideQuestController.js";
import { authentication } from "../../middlewares/authentication.js";
import { optionalAuthentication } from "../../middlewares/optionalAuthentication.js";
import requireAdmin from "../../middlewares/requireAdmin.js";

const sideQuestRouter = express.Router();
const controller = new SideQuestController();

sideQuestRouter.get("/active", optionalAuthentication, controller.getActiveQuests.bind(controller));
sideQuestRouter.get("/task/:quest_id", optionalAuthentication, controller.getQuest.bind(controller));

sideQuestRouter.post("/:quest_id/accept", authentication, controller.acceptQuest.bind(controller));
sideQuestRouter.post("/:quest_id/complete", authentication, controller.completeQuest.bind(controller));

sideQuestRouter.get("/all", authentication, requireAdmin, controller.getAllQuests.bind(controller));
sideQuestRouter.post("/", authentication, requireAdmin, controller.createQuest.bind(controller));
sideQuestRouter.put("/:quest_id", authentication, requireAdmin, controller.updateQuest.bind(controller));
sideQuestRouter.delete("/:quest_id", authentication, requireAdmin, controller.deleteQuest.bind(controller));

export default sideQuestRouter;
