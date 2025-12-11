import { Router } from 'express';
import accountRouter from './accountRoutes.js';
import passport from 'passport';

//import homeRouter from './homeRoutes.js';

const v1 = new Router();

v1.use('/account', accountRouter);

v1.use(passport.initialize())
v1.use(passport.session())
v1.get('/login/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

v1.get('/login/google/redirect', passport.authenticate('google', { session: false }), (req, res) => {
    res.send('Redirected.')
    console.log(req.user)
});

v1.get('/read-cookie', (req, res) => {
    console.log(req);
    res.json({cookie: req.cookies})
})


export default v1;