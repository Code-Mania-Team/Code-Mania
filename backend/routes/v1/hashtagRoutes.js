import express from "express";
import HashtagController from "../../controllers/v1/hashtagController.js";
import { authLimiter } from "../../middlewares/rateLimiter.js";

const hashtagRouter = express.Router();
const hashtag = new HashtagController();

// Public: get top hashtags
hashtagRouter.get("/top", authLimiter(), hashtag.topHashtags.bind(hashtag));

// Public: search hashtags (by usage)
hashtagRouter.get("/search", authLimiter(), hashtag.search.bind(hashtag));

// Public: posts for a hashtag
hashtagRouter.get("/:tag/posts", authLimiter(), hashtag.postsByHashtag.bind(hashtag));

export default hashtagRouter;
