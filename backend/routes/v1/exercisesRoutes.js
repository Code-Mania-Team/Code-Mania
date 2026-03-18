import express from "express";
import ExerciseController from "../../controllers/v1/exerciseController.js";
import { authentication } from "../../middlewares/authentication.js";
import { attachUserIfValid } from "../../middlewares/OptionalAuth.js";


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
  attachUserIfValid,
  exerciseController.getExerciseById.bind(exerciseController)
);

publicExerciseRouter.get(
  "/exercises/programming-language/:programming_language_id",
  exerciseController.getExercisesByLanguage.bind(exerciseController)
);

publicExerciseRouter.post(
  "/exercises/validate",
  attachUserIfValid,
  exerciseController.validateExercise.bind(exerciseController)
);

publicExerciseRouter.post(
  "/exercises/validate-preview",
  attachUserIfValid,
  exerciseController.validateExercisePreview.bind(exerciseController)
);

publicExerciseRouter.post(
  "/exercises/start",
  attachUserIfValid,
  exerciseController.startExercise.bind(exerciseController)
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


export { publicExerciseRouter };