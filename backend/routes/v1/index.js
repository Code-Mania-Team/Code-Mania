import { Router } from 'express';
import accountRouter from './accountRoutes.js';
import passport from 'passport';
import freedomWallRouter from './freedomWallRoutes.js';
import homeRouter from './homeRoutes.js';

const v1 = new Router();

v1.use('/account', accountRouter);
v1.use('/', homeRouter);
v1.use('/freedom-wall', freedomWallRouter);

export default v1;