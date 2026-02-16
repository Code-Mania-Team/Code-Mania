import express from "express";
import AccountController from "../../controllers/v1/accountController.js";
const refreshRouter = express.Router();
const account = new AccountController();
refreshRouter.get("/", account.refresh.bind(account));
export default refreshRouter;
