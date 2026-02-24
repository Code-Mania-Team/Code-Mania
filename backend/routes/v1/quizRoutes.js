import { Router } from 'express';
import authentication from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import { getQuizById, completeQuiz } from '../../controllers/v1/quizController.js';  

const router = Router();

router.get('/:language/:quizId', getQuizById);
router.post(
  '/:language/:quizId/complete',
  authentication,
  authorization,
  completeQuiz
);

export default router;