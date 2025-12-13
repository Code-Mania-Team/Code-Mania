import  refreshController  from "../../controllers/v1/refreshController.js";
import express from 'express';
const refreshRouter = express.Router();

const token = new refreshController();
refreshRouter.get("/refresh", token.refreshAccessToken.bind(token));

export default refreshRouter;