// routes/v1/auth.js
import express from 'express';
import AccountController from '../../controllers/accountController.js';

const router = express.Router();
const account = new AccountController();

// 🔹 Magic Link (Send email)
router.post('/send-magic-link', account.sendMagicLink);

// 🔹 Verify token
router.get('/verify-token', account.verifyToken);

// 🔹 Google callback (optional if you manage OAuth server-side)
router.get('/google/callback', account.googleCallback);

// 🔹 Profile (protected)
router.get('/profile', account.profile);

export default router;
