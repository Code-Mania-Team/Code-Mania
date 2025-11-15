// routes/v1/auth.js
import express from 'express';
import AccountController from '../../controllers/v1/accountController.js';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';

const accountRouter = express.Router();
const account = new AccountController();

accountRouter.use(authorization);


// Send magic link
accountRouter.post('/sign-up', account.sendMagicLink);

// Verify magic link
accountRouter.get('/verify', account.verifyMagicLink);
// Allow POST verification from frontend (AJAX) where token is in the body
accountRouter.post('/verify', account.verifyMagicLink);

// Update username (requires authentication)
accountRouter.post('/username', authentication, account.setUsername.bind(account));

// Get current user's profile
accountRouter.get('/profile', authentication, account.getProfile.bind(account));

// Delete Account
accountRouter.delete('/', authentication, account.deleteUser.bind(account));

export default accountRouter;
