import Hashtag from "../models/hashtag.js";

class HashtagService {
    constructor() {
        this.hashtag = new Hashtag();
    }

    normalizeHashtag(raw) {
        if (typeof raw !== "string") return null;
        let t = raw.trim().toLowerCase();
        if (!t) return null;
        if (!t.startsWith("#")) t = `#${t}`;
        if (!/^#[a-z0-9_]{1,50}$/.test(t)) return null;
        return t;
    }

    async getTopHashtags(limitRaw = 10) {
        const limit = limitRaw ? Number(limitRaw) : 10;
        const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;

        const rows = await this.hashtag.listPostHashtagLinksWithHashtag();

        const counts = new Map();
        for (const row of rows || []) {
            const tagText = row?.hashtags?.hashtag_text;
            if (!tagText) continue;
            counts.set(tagText, (counts.get(tagText) || 0) + 1);
        }

        return Array.from(counts.entries())
            .map(([hashtag_text, usage_count]) => ({ hashtag_text, usage_count }))
            .sort((a, b) => Number(b.usage_count) - Number(a.usage_count))
            .slice(0, safeLimit);
    }

    async searchHashtags(queryRaw, limitRaw = 20) {
        const q = typeof queryRaw === "string" ? queryRaw.trim().toLowerCase() : "";
        if (!q) return [];

        const limit = limitRaw ? Number(limitRaw) : 20;
        const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 50 ? limit : 20;

        const rows = await this.hashtag.listPostHashtagLinksWithHashtag(q);

        const counts = new Map();
        for (const row of rows || []) {
            const tagText = row?.hashtags?.hashtag_text;
            if (!tagText) continue;
            counts.set(tagText, (counts.get(tagText) || 0) + 1);
        }

        return Array.from(counts.entries())
            .map(([hashtag_text, usage_count]) => ({ hashtag_text, usage_count }))
            .sort((a, b) => Number(b.usage_count) - Number(a.usage_count))
            .slice(0, safeLimit);
    }

    async getPostsByHashtag(tagRaw, { limit = 20, offset = 0 } = {}) {
        const tag = this.normalizeHashtag(tagRaw);
        if (!tag) {
            const err = new Error("Invalid hashtag");
            err.code = "INVALID_HASHTAG";
            throw err;
        }

        const rows = await this.hashtag.listPostsByHashtag(tag, { limit, offset });
        return (rows || [])
            .map((r) => r?.freedom_wall)
            .filter(Boolean);
    }
}

export default HashtagService;
