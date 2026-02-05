import express from "express";

import ExecuteController from "../../controllers/v1/executeController.js";

const executeRouter = express.Router();
const execute = new ExecuteController();

executeRouter.post("/", execute.execute.bind(execute));


export default executeRouter;