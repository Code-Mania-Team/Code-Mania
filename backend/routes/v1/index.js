import { Router } from 'express';
import accountRouter from './accountRoutes.js';
import passport from 'passport';
import freedomWallRouter from './freedomWallRoutes.js';
import homeRouter from './homeRoutes.js';

const v1 = new Router();

v1.use('/account', accountRouter);
v1.use('/', homeRouter);
v1.use('/freedom-wall', freedomWallRouter);

v1.get('/login/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

v1.get('/login/google/redirect', passport.authenticate('google', {session: false}), (req, res) => {
    res.send('/v1/redirected.')
    req.sessionId = req.user.id
    console.log(req.user.emails[0].value)
    console.log(req.sessionId)
});


export default v1;