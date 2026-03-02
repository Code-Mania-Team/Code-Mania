import { Router } from 'express';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import requireAdmin from '../../middlewares/requireAdmin.js';
import AdminExamController from '../../controllers/v1/adminExamController.js';
import ExerciseController from '../../controllers/v1/exerciseController.js';
import AdminController from '../../controllers/v1/adminController.js';
import { userModel } from '../../models/user.js';

const router = Router();
const adminExam = new AdminExamController();
const exerciseController = new ExerciseController();
const adminController = new AdminController();

// router.use(authorization);

router.get("/activeUsers", adminController.activeUsers.bind(adminController));
router.get('/users', authentication, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await userModel.db
      .from('users')
      .select('user_id, email, username, full_name, character_id, created_at, role')
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

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
