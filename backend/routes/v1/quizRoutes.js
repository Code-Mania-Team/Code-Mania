import { Router } from 'express';
import { getQuizById } from '../../controllers/v1/quizController.js';  

const router = Router();

router.get('/:language/:quizId', getQuizById);

export default router;