import express from 'express';
import ForgotPasswordController from '../../controllers/v1/forgotPasswordController.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const forgotPasswordRouter = express.Router();
const forgotPassword = new ForgotPasswordController();

// Forgot Password endpoints - 3 Step Process
forgotPasswordRouter.post('/request-otp', authLimiter(), forgotPassword.requestPasswordReset.bind(forgotPassword));
forgotPasswordRouter.post('/verify-otp', authLimiter(), forgotPassword.verifyPasswordReset.bind(forgotPassword));
forgotPasswordRouter.post('/reset-password', authLimiter(), forgotPassword.resetPassword.bind(forgotPassword));

export default forgotPasswordRouter;