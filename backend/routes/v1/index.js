import { Router } from 'express';

import homeRouter from './homeRoutes.js';

const v1 = new Router();

v1.use('/', homeRouter);

export default v1;