import express from 'express';
import AccountController from '../../controllers/v1/accountController.js';
import { authorization } from '../../middlewares/authorization.js';

const refreshRouter = express.Router();
const account = new AccountController();

refreshRouter.use(authorization);
refreshRouter.get('/', account.refresh.bind(account));

export default refreshRouter;
