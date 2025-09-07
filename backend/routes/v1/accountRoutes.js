import { Router } from 'express';

import AccountController from '../../controllers/v1/accountController.js';
import authorization from '../../middlewares/authorization.js';
import authentication from '../../middlewares/authentication.js';

const accountRouter = new Router();
const account = new AccountController();

// Ensure that all endpoints implements authorization
accountRouter.use(authorization);

accountRouter.post('/login', account.login.bind(account));
accountRouter.post('/', account.create.bind(account));
accountRouter.get('/', authentication, account.profile.bind(account));

export default accountRouter;