// routes/v1/accountRoutes.js
import express from 'express';
import AccountController from '../../controllers/v1/accountController.js';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import passport from 'passport';

const accountRouter = express.Router();
const account = new AccountController();

// Optional: protect some routes with authorization middleware
// accountRouter.use(authorization);

// 🔹 Request OTP (signup or login) – single endpoint
accountRouter.post('/sign-up', (req, res) => {
    const action = req.query.action;
    try {
        if (!(action === 'requestOtp' || action === 'verifyOtp')) {
            res.status(400).send({
                code: 400,
                message: 'Bad request'
            })
        } else {
            account[action](req, res); //There is a problem here. It will call any methods passed in params LOL.
        }
    } catch (error) {
        console.error(error)
    }
});

// 🔹 Set username (requires authentication)
accountRouter.post('/username', authentication, account.setUsername.bind(account));

accountRouter.post('/login', account.login.bind(account));

accountRouter.get('/login/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

accountRouter.get('/login/google/redirect', passport.authenticate('google', { session: false }), (req, res) => {
    console.log(req.user)
    res.send('/v1/account/login/google/redirect')
});

accountRouter.post('/logout', authentication, account.logout.bind(account));


// 🔹 Get current user's profile
accountRouter.get('/', authentication, account.profile.bind(account));

// 🔹 Update profile (username/bio)
accountRouter.patch('/', authentication, account.updateProfile.bind(account));

// 🔹 Delete account
accountRouter.delete('/', authentication, account.deleteUser.bind(account));

export default accountRouter;
