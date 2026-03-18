import express from "express";
import ExerciseController from "../../controllers/v1/exerciseController.js";
import { authentication } from "../../middlewares/authentication.js";
import jwt from "jsonwebtoken";

const publicExerciseRouter = express.Router(); // public router

const exerciseController = new ExerciseController();

// Best-effort auth: attach user context when token is valid, but allow guests.
// Important: If token is missing/invalid/expired, DO NOT 401.
const attachUserIfValid = (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) return next();

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err || !decoded) return next();

    req.user = decoded;
    res.locals.user_id = decoded.user_id;
    res.locals.username = decoded.username;
    res.locals.role = decoded.role;
    if (decoded.email) res.locals.email = decoded.email;
    next();
  });
};


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
