import e, { Router } from "express";

import ExecuteController from "../../controllers/v1/executeController.js";

const executeRouter = new Router();
const execute = new ExecuteController();

executeRouter.post("/run", execute.execute.bind(execute));


export default executeRouter;