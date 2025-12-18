import { Router } from 'express';
import accountRouter from './accountRoutes.js';
import passport from 'passport';
import freedomWallRouter from './freedomWallRoutes.js';
import homeRouter from './homeRoutes.js';
import refreshRouter from './refreshRoute.js';

const v1 = new Router();

v1.use('/account', accountRouter);
v1.use('/', homeRouter);
v1.use('/freedom-wall', freedomWallRouter);
v1.use('/refresh', refreshRouter);

v1.get('/login/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

v1.get('/login/google/redirect', passport.authenticate('google'), (req, res) => {
    res.send('Redirected.')
    console.log(req.cookies)
    console.log(req.user.id)
});


export default v1;