import { Router } from 'express';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import requireAdmin from '../../middlewares/requireAdmin.js';
import uploadImage from '../../middlewares/uploadImage.js';
import AdminExamController from '../../controllers/v1/adminExamController.js';
import AdminQuizController from '../../controllers/v1/adminQuizController.js';
import AdminCosmeticsController from '../../controllers/v1/adminCosmeticsController.js';
import ExerciseController from '../../controllers/v1/exerciseController.js';
import AdminController from '../../controllers/v1/adminController.js';

const router = Router();
const adminExam = new AdminExamController();
const adminQuiz = new AdminQuizController();
const adminCosmetics = new AdminCosmeticsController();
const exerciseController = new ExerciseController();
const adminController = new AdminController();

// router.use(authorization);

router.get("/activeUsers", adminController.activeUsers.bind(adminController));

router.get(
  "/trafficLogs7Days",
  adminController.trafficLogs7Days.bind(adminController),
);

// ---------------- EXAM (ADMIN) ----------------
// Get exam problem (full, including test_cases)
router.get(
  "/exam/problems/:problemId",
  authentication,
  requireAdmin,
  adminExam.getProblem.bind(adminExam),
);

// Update exam problem
router.patch(
  "/exam/problems/:problemId",
  authentication,
  requireAdmin,
  adminExam.updateProblem.bind(adminExam),
);

// ---------------- QUIZZES (ADMIN) ----------------
router.get(
  "/quizzes",
  authentication,
  requireAdmin,
  adminQuiz.list.bind(adminQuiz),
);

router.get(
  "/quizzes/:quizId",
  authentication,
  requireAdmin,
  adminQuiz.get.bind(adminQuiz),
);

router.patch(
  "/quizzes/:quizId",
  authentication,
  requireAdmin,
  adminQuiz.update.bind(adminQuiz),
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

// ---------------- COSMETICS (ADMIN) ----------------
router.get(
  "/cosmetics",
  authentication,
  requireAdmin,
  adminCosmetics.list.bind(adminCosmetics),
);

router.post(
  "/cosmetics",
  authentication,
  requireAdmin,
  adminCosmetics.create.bind(adminCosmetics),
);

router.post(
  "/cosmetics/upload-image",
  authentication,
  requireAdmin,
  uploadImage.single("image"),
  adminCosmetics.uploadImage.bind(adminCosmetics),
);

router.patch(
  "/cosmetics/:key",
  authentication,
  requireAdmin,
  adminCosmetics.update.bind(adminCosmetics),
);

router.delete(
  "/cosmetics/:key",
  authentication,
  requireAdmin,
  adminCosmetics.remove.bind(adminCosmetics),
);

export default router;
