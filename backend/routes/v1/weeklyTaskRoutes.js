import express from 'express';
import WeeklyTaskController from '../../controllers/v1/weeklyTaskController.js';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';

const weeklyTaskRouter = express.Router();
const controller = new WeeklyTaskController();

// ── Public routes (no auth) ───────────────────────────────────
weeklyTaskRouter.get('/past', controller.listPast.bind(controller));
weeklyTaskRouter.get('/:task_id/participants', controller.listParticipants.bind(controller));

// ── User routes (authenticated) ────────────────────────────────
weeklyTaskRouter.get('/active', authentication, controller.getActiveTasks.bind(controller));
weeklyTaskRouter.post('/:task_id/accept', authentication, controller.acceptTask.bind(controller));
weeklyTaskRouter.post('/:task_id/complete', authentication, controller.completeTask.bind(controller));
weeklyTaskRouter.post('/:task_id/submit', authentication, controller.submitTask.bind(controller));

// ── Admin routes ───────────────────────────────────────────────
weeklyTaskRouter.get('/all', authentication, authorization, controller.getAllTasks.bind(controller));
weeklyTaskRouter.post('/', authentication, authorization, controller.createTask.bind(controller));
weeklyTaskRouter.put('/:task_id', authentication, authorization, controller.updateTask.bind(controller));
weeklyTaskRouter.delete('/:task_id', authentication, authorization, controller.deleteTask.bind(controller));

// Fetch a single task (safe). Keep this after static routes like /all.
weeklyTaskRouter.get('/task/:task_id', authentication, controller.getTask.bind(controller));

// Admin winners
weeklyTaskRouter.post('/:task_id/winners', authentication, authorization, controller.setWinners.bind(controller));

export default weeklyTaskRouter;
