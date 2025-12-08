import { Router } from 'express';

import accountRouter from './accountRoutes.js';
import refreshRouter from './refreshRoute.js';

//import homeRouter from './homeRoutes.js';

const v1 = new Router();

v1.use('/account', accountRouter);
v1.use('/token', refreshRouter);

export default v1;