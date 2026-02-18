import express from "express";
import ExerciseController from "../../controllers/v1/exerciseController.js";
import { authentication } from "../../middlewares/authentication.js";
import requireAdmin from "../../middlewares/requireAdmin.js";

const exercisesRouter = express.Router();      // admin router
const publicExerciseRouter = express.Router(); // public router

const exerciseController = new ExerciseController();


// ---------------- PUBLIC ROUTES ----------------
// no authentication
publicExerciseRouter.get("/exercises", exerciseController.getAllExercises.bind(exerciseController)
);

publicExerciseRouter.get("/exercises/:id", exerciseController.getExerciseById.bind(exerciseController));

publicExerciseRouter.get("/exercises/programming-language/:programming_language_id",exerciseController.getExercisesByLanguage.bind(exerciseController)
);


// ---------------- ADMIN ROUTES ----------------
// apply middleware only to admin router
exercisesRouter.use(authentication);
exercisesRouter.use(requireAdmin);

exercisesRouter.post("/exercises", exerciseController.createExercise.bind(exerciseController));

exercisesRouter.patch("/exercises/:id", exerciseController.updateExercise.bind(exerciseController));

exercisesRouter.delete("/exercises/:id", exerciseController.deleteExercise.bind(exerciseController));


export { exercisesRouter, publicExerciseRouter };
