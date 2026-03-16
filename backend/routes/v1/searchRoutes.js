import express from "express";
import SearchController from "../../controllers/v1/searchController.js";
import { authLimiter } from "../../middlewares/rateLimiter.js";

const searchRouter = express.Router();
const search = new SearchController();

searchRouter.get("/", authLimiter(), search.searchAll.bind(search));

export default searchRouter;
