import { Router } from 'express';
import HomeController from '../../controllers/v1/homeController.js';

const homeRouter = new Router();
const home = new HomeController();

homeRouter.get('/', home.indexAction.bind(home));

export default homeRouter;