import express from "express";
import ExerciseController from "../../controllers/v1/exerciseController.js";
import { authentication } from "../../middlewares/authentication.js";
import requireAdmin from "../../middlewares/requireAdmin.js";

const exercisesRouter = express.Router();      // admin router
const publicExerciseRouter = express.Router(); // public router

const exerciseController = new ExerciseController();


// ---------------- PUBLIC ROUTES ----------------
// no authentication
publicExerciseRouter.get(
  "/exercises",
  exerciseController.getAllExercises.bind(exerciseController)
);

publicExerciseRouter.get(
  "/exercises/:id",
  authentication,
  exerciseController.getExerciseById.bind(exerciseController)
);

publicExerciseRouter.get(
  "/exercises/programming-language/:programming_language_id",
  exerciseController.getExercisesByLanguage.bind(exerciseController)
);

publicExerciseRouter.post(
  "/exercises/validate",
  authentication,
  exerciseController.validateExercise.bind(exerciseController)
);

publicExerciseRouter.get(
  "/exercises/:id/next",
  authentication,
  exerciseController.getNextExercise.bind(exerciseController)
);

publicExerciseRouter.get(
  "/exercises/programming-language/:programming_language_id/latest",
  authentication,
  exerciseController.getLatestUnlocked.bind(exerciseController)
);


// ---------------- ADMIN ROUTES ----------------
// apply middleware ONLY to admin router
exercisesRouter.use(authentication);
exercisesRouter.use(requireAdmin);

exercisesRouter.post(
  "/exercises",
  exerciseController.createExercise.bind(exerciseController)
);

exercisesRouter.patch(
  "/exercises/:id",
  exerciseController.updateExercise.bind(exerciseController)
);

exercisesRouter.delete(
  "/exercises/:id",
  exerciseController.deleteExercise.bind(exerciseController)
);


export { exercisesRouter, publicExerciseRouter };
