import { Router } from 'express';
import authentication from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import QuizController from '../../controllers/v1/quizController.js';

const router = Router();
const quizController = new QuizController();

router.get('/:language/:quizId', quizController.getQuizById.bind(quizController));
router.post(
  '/:language/:quizId/complete',
  authentication,
  authorization,
  quizController.completeQuiz.bind(quizController)
);

export default router;
