// routes/v1/auth.js
import express from 'express';
import AccountController from '../../controllers/accountController.js';
import authorization from "../../middlewares/authorization.js";
import authentication from "../../middlewares/authentication.js";
import { use } from 'react';

const router = express.Router();
const account = new AccountController();

//accountRouter,use(authorization)

// Magic Link (Send email)
//router.post('/sign-up', account.sendMagicLink);


export default router;
