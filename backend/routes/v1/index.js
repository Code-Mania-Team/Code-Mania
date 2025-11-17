import { Router } from 'express';

import accountRouter from './accountRoutes.js';
import executeRouter from './executeRoutes.js';

//import homeRouter from './homeRoutes.js';

const v1 = new Router();

v1.use('/', accountRouter);
v1.use('/', executeRouter);

export default v1;