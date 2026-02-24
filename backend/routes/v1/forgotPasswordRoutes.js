import express from 'express';
import ForgotPasswordController from '../../controllers/v1/forgotPasswordController.js';

const forgotPasswordRouter = express.Router();
const forgotPassword = new ForgotPasswordController();

// Forgot Password endpoints - 3 Step Process
forgotPasswordRouter.post('/request-otp', forgotPassword.requestPasswordReset.bind(forgotPassword));
forgotPasswordRouter.post('/verify-otp', forgotPassword.verifyPasswordReset.bind(forgotPassword));
forgotPasswordRouter.post('/reset-password', forgotPassword.resetPassword.bind(forgotPassword));

export default forgotPasswordRouter;