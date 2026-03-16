import HashtagService from "../../services/hashtagService.js";

class HashtagController {
    constructor() {
        this.service = new HashtagService();
    }

    async topHashtags(req, res) {
        try {
            const tags = await this.service.getTopHashtags(req.query?.limit);
            return res.status(200).json({
                success: true,
                message: "Top hashtags retrieved",
                data: tags,
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message || "Internal server error" });
        }
    }

    async search(req, res) {
        try {
            const q = req.query?.q;
            const tags = await this.service.searchHashtags(q, req.query?.limit);
            return res.status(200).json({
                success: true,
                message: "Hashtags retrieved",
                data: tags,
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message || "Internal server error" });
        }
    }

    async postsByHashtag(req, res) {
        try {
            const tag = req.params?.tag;
            const posts = await this.service.getPostsByHashtag(tag, {
                limit: req.query?.limit,
                offset: req.query?.offset,
            });

            return res.status(200).json({
                success: true,
                message: "Posts retrieved",
                data: posts,
            });
        } catch (err) {
            if (err?.code === "INVALID_HASHTAG") {
                return res.status(400).json({ success: false, message: "Invalid hashtag" });
            }
            return res.status(500).json({ success: false, message: err.message || "Internal server error" });
        }
    }
}

export default HashtagController;
