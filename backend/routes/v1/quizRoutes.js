import { Router } from 'express';
import authentication from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import QuizController from '../../controllers/v1/quizController.js';

const router = Router();
const quizController = new QuizController();

// Authenticated: user attempt history
router.get(
  '/attempts',
  authentication,
  quizController.listAttempts.bind(quizController)
);

router.get('/:language/:quizId', quizController.getQuizById.bind(quizController));

// Authenticated: run visible test cases (no attempt recorded)
router.post(
  '/:language/:quizId/run',
  authentication,
  quizController.runQuiz.bind(quizController)
);

router.post(
  '/:language/:quizId/complete',
  authentication,
  quizController.completeQuiz.bind(quizController)
);

export default router;
