import { Router } from "express";
import { authorization } from "../../middlewares/authorization.js";
import { authentication } from "../../middlewares/authentication.js";
import requireAdmin from "../../middlewares/requireAdmin.js";
import MetricsController from "../../controllers/v1/metricsController.js";

const router = Router();
const metricsController = new MetricsController();

router.use(authorization);

router.get("/admin-summary", metricsController.getAdminSummary.bind(metricsController));

router.get(
  "/quiz-attempts",
  authentication,
  requireAdmin,
  metricsController.getQuizAttempts.bind(metricsController)
);

router.get(
  "/quiz-attempts/by-user",
  authentication,
  requireAdmin,
  metricsController.getQuizAttemptsByUser.bind(metricsController)
);

router.get(
  "/quiz-attempts/by-user/:userId",
  authentication,
  requireAdmin,
  metricsController.getQuizAttemptsByUserId.bind(metricsController)
);

router.get(
  "/exam-attempts",
  authentication,
  requireAdmin,
  metricsController.getExamAttempts.bind(metricsController)
);

router.get(
  "/exam-attempts/by-user",
  authentication,
  requireAdmin,
  metricsController.getExamAttemptsByUser.bind(metricsController)
);

router.get(
  "/exam-attempts/by-user/:userId",
  authentication,
  requireAdmin,
  metricsController.getExamAttemptsByUserId.bind(metricsController)
);

export default router;
