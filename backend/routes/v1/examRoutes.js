import express from "express";

import ExamController from "../../controllers/v1/examController.js";
import { authentication } from "../../middlewares/authentication.js";

const examRouter = express.Router();
const exam = new ExamController();

// Public: browse exam problems
examRouter.get("/problems", exam.listProblems.bind(exam));
examRouter.get("/problems/:problemId", exam.getProblem.bind(exam));

// Authenticated: attempts & status
examRouter.post(
  "/attempts/start",
  authentication,
  exam.startAttempt.bind(exam),
);
examRouter.post(
  "/attempts/:attemptId/submit",
  authentication,
  exam.submitAttempt.bind(exam),
);

//URL: {{baseUrl}}/v1/exam/attempts?language=cpp&limit=50
examRouter.get("/attempts", authentication, exam.listAttempts.bind(exam));
examRouter.get("/status", authentication, exam.status.bind(exam));

export default examRouter;
