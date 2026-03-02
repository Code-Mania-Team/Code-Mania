import { Router } from 'express';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import requireAdmin from '../../middlewares/requireAdmin.js';
import AdminExamController from '../../controllers/v1/adminExamController.js';
import ExerciseController from '../../controllers/v1/exerciseController.js';
import AdminController from '../../controllers/v1/adminController.js';

const router = Router();
const adminExam = new AdminExamController();
const exerciseController = new ExerciseController();
const adminController = new AdminController();

// router.use(authorization);

router.get("/activeUsers", adminController.activeUsers.bind(adminController));

router.get(
  "/trafficLogs7Days",
  adminController.trafficLogs7Days.bind(adminController),
);

// ---------------- EXAM (ADMIN) ----------------
// Update exam problem
router.patch(
  "/exam/problems/:problemId",
  authentication,
  requireAdmin,
  adminExam.updateProblem.bind(adminExam),
);

// ---------------- EXERCISES (ADMIN) ----------------
// Moved from exercisesRoutes admin router into /admin.
router.post(
  "/exercises",
  authentication,
  requireAdmin,
  exerciseController.createExercise.bind(exerciseController),
);

router.patch(
  "/exercises/:id",
  authentication,
  requireAdmin,
  exerciseController.updateExercise.bind(exerciseController),
);

// Frontend admin uses PUT; accept it as alias of PATCH.
router.put(
  '/exercises/:id',
  authentication,
  requireAdmin,
  exerciseController.updateExercise.bind(exerciseController),
);

router.delete(
  "/exercises/:id",
  authentication,
  requireAdmin,
  exerciseController.deleteExercise.bind(exerciseController),
);

export default router;