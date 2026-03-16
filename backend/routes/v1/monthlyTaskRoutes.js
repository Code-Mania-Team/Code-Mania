import express from "express";
import MonthlyTaskController from "../../controllers/v1/monthlyTaskController.js";
import { authentication } from "../../middlewares/authentication.js";
import { authorization } from "../../middlewares/authorization.js";

const monthlyTaskRouter = express.Router();
const controller = new MonthlyTaskController();

// ── User routes (authenticated) ────────────────────────────────
monthlyTaskRouter.get("/active", authentication, controller.getActiveTasks.bind(controller));
monthlyTaskRouter.post("/:task_id/accept", authentication, controller.acceptTask.bind(controller));
monthlyTaskRouter.post("/:task_id/complete", authentication, controller.completeTask.bind(controller));

// ── Admin routes ───────────────────────────────────────────────
monthlyTaskRouter.get("/all", authentication, authorization, controller.getAllTasks.bind(controller));
monthlyTaskRouter.post("/", authentication, authorization, controller.createTask.bind(controller));
monthlyTaskRouter.put("/:task_id", authentication, authorization, controller.updateTask.bind(controller));
monthlyTaskRouter.delete("/:task_id", authentication, authorization, controller.deleteTask.bind(controller));

export default monthlyTaskRouter;
