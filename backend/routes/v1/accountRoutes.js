// routes/v1/accountRoutes.js
import express from 'express';
import AccountController from '../../controllers/v1/accountController.js';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';

const accountRouter = express.Router();
const account = new AccountController();

// Optional: protect some routes with authorization middleware
accountRouter.use(authorization);

// 🔹 Request OTP (signup or login) – single endpoint
accountRouter.post('/request-otp', account.requestOtp.bind(account));

// 🔹 Verify OTP after user clicks or enters it
accountRouter.post('/verify-otp', account.verifyOtp.bind(account));

// 🔹 Set username (requires authentication)
accountRouter.post('/username', authentication, account.setUsername.bind(account));

// 🔹 Get current user's profile
accountRouter.get('/profile', authentication, account.profile.bind(account));

// 🔹 Update profile (username/bio)
accountRouter.patch('/profile', authentication, account.updateProfile.bind(account));

// 🔹 Delete account
accountRouter.delete('/', authentication, account.deleteUser.bind(account));

export default accountRouter;
