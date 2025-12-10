import { Router } from 'express';
import accountRouter from './accountRoutes.js';
import passport from 'passport';

//import homeRouter from './homeRoutes.js';

const v1 = new Router();

v1.use('/account', accountRouter);

v1.get('/login/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

v1.get('/login/google/redirect', passport.authenticate('google', { session: false }), (req, res) => {
    res.send('Redirected.')
    console.log(req.user)
});


export default v1;