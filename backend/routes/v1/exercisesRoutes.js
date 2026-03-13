import express from "express";
import ExerciseController from "../../controllers/v1/exerciseController.js";
import { authentication } from "../../middlewares/authentication.js";

const publicExerciseRouter = express.Router(); // public router

const exerciseController = new ExerciseController();

// Best-effort auth: attach user context when token exists, but allow guests.
const optionalAuthentication = (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) return next();
  return authentication(req, res, next);
};


// ---------------- PUBLIC ROUTES ----------------
// no authentication
publicExerciseRouter.get(
  "/exercises",
  exerciseController.getAllExercises.bind(exerciseController)
);

publicExerciseRouter.get(
  "/exercises/:id",
  optionalAuthentication,
  exerciseController.getExerciseById.bind(exerciseController)
);

publicExerciseRouter.get(
  "/exercises/programming-language/:programming_language_id",
  exerciseController.getExercisesByLanguage.bind(exerciseController)
);

publicExerciseRouter.post(
  "/exercises/validate",
  optionalAuthentication,
  exerciseController.validateExercise.bind(exerciseController)
);

publicExerciseRouter.post(
  "/exercises/validate-preview",
  exerciseController.validateExercisePreview.bind(exerciseController)
);

publicExerciseRouter.post(
  "/exercises/start",
  optionalAuthentication,
  exerciseController.startExercise.bind(exerciseController)
);

publicExerciseRouter.get(
  "/exercises/:id/next",
  exerciseController.getNextExercise.bind(exerciseController)
);

publicExerciseRouter.get(
  "/exercises/programming-language/:programming_language_id/latest",
  authentication,
  exerciseController.getLatestUnlocked.bind(exerciseController)
);


export { publicExerciseRouter };
