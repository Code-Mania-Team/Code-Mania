import Hashtag from "../models/hashtag.js";
import UserPreferences from "../models/userPreferences.js";
import Cosmetics from "../models/cosmetics.js";

class HashtagService {
    constructor() {
        this.hashtag = new Hashtag();
        this.userPreferences = new UserPreferences();
        this.cosmetics = new Cosmetics();
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
        const posts = (rows || [])
            .map((r) => r?.freedom_wall)
            .filter(Boolean);

        return await this.attachAvatarFramesToPosts(posts);
    }

    async attachAvatarFramesToPosts(posts) {
        const list = Array.isArray(posts) ? posts : [];
        if (!list.length) return list;

        const userIds = Array.from(
            new Set(
                list
                    .map((p) => p?.users?.user_id || p?.user_id)
                    .map((id) => (id === null || id === undefined ? null : Number(id)))
                    .filter((n) => Number.isFinite(n) && n > 0)
            )
        );
        if (!userIds.length) return list;

        let prefs = [];
        try {
            prefs = await this.userPreferences.getByUserIds(userIds);
        } catch {
            prefs = [];
        }
        const prefByUserId = new Map((prefs || []).map((p) => [Number(p.user_id), p]));

        const frameKeys = Array.from(
            new Set(
                (prefs || [])
                    .map((p) => (p?.avatar_frame_key ? String(p.avatar_frame_key) : ""))
                    .filter(Boolean)
            )
        );

        let frames = [];
        try {
            frames = await this.cosmetics.getByKeys(frameKeys);
        } catch {
            frames = [];
        }
        const frameUrlByKey = new Map(
            (frames || [])
                .filter((c) => c?.key)
                .map((c) => [String(c.key), c?.asset_url ? String(c.asset_url) : null])
        );

        return list.map((post) => {
            const users = post?.users && typeof post.users === "object" ? post.users : null;
            const userId = Number(users?.user_id || post?.user_id);
            const pref = Number.isFinite(userId) ? prefByUserId.get(userId) : null;
            const key = pref?.avatar_frame_key ? String(pref.avatar_frame_key) : null;
            const url = key ? (frameUrlByKey.get(key) || null) : null;

            return {
                ...post,
                avatar_frame_key: key,
                avatar_frame_url: url,
                ...(users
                    ? {
                        users: {
                            ...users,
                            avatar_frame_key: key,
                            avatar_frame_url: url,
                        },
                    }
                    : null),
            };
        });
    }
}

export default HashtagService;
