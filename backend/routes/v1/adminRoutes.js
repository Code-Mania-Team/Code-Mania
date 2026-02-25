import { Router } from "express";
import { authentication } from "../../middlewares/authentication.js";
import { authorization } from "../../middlewares/authorization.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";
import User from "../../models/user.js";
import AdminExamController from "../../controllers/v1/adminExamController.js";
import ExerciseController from "../../controllers/v1/exerciseController.js";
import AdminController from "../../controllers/v1/adminController.js";

const router = Router();
const userModel = new User();
const adminExam = new AdminExamController();
const exerciseController = new ExerciseController();

// router.use(authorization);

router.get("/", AdminController.getDashboard);

router.get("/users", authentication, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await userModel.db
      .from("users")
      .select(
        "user_id, email, username, full_name, profile_image, character_id, created_at, role",
      )
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch users" });
  }
});

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
router.patch(
  "/exercises/:id",
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
