import { Router } from 'express';
import accountRouter from './accountRoutes.js';

//import homeRouter from './homeRoutes.js';

const v1 = new Router();

v1.use('/account', accountRouter);

export default v1;