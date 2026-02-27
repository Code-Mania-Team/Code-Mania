import { Router } from "express";
// import { authentication } from "../../middlewares/authentication.js";
// import { authorization } from "../../middlewares/authorization.js";
// import { requireAdmin } from "../../middlewares/requireAdmin.js";
// import AdminExamController from "../../controllers/v1/adminExamController.js";
// import ExerciseController from "../../controllers/v1/exerciseController.js";
import AdminController from "../../controllers/v1/adminController.js";

const adminRouter = Router();

// const adminExam = new AdminExamController();
// const exerciseController = new ExerciseController();
const adminController = new AdminController();

// router.use(authorization);

adminRouter.get(
  "/dashboard",
  adminController.getDashboard.bind(adminController),
);

export default adminRouter;
