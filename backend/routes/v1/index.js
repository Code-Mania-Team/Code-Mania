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
    const image = req.user.photos[0].value
    console.log(req.user);
    res.send(`<img src=${image}></img>`)
});



export default v1;