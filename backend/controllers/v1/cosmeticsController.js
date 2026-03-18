import UserCosmetics from "../../models/userCosmetics.js";
import UserPreferences from "../../models/userPreferences.js";
import Cosmetics from "../../models/cosmetics.js";

class CosmeticsController {
  constructor() {
    this.userCosmetics = new UserCosmetics();
    this.userPreferences = new UserPreferences();
    this.cosmetics = new Cosmetics();
  }

  async me(req, res) {
    try {
      const user_id = res.locals.user_id;
      if (!user_id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const [prefs, ownedRows] = await Promise.all([
        this.userPreferences.getByUserId(user_id).catch(() => null),
        this.userCosmetics.listOwnedRowsByUserId(user_id).catch(() => []),
      ]);

      const keys = (ownedRows || []).map((r) => r?.cosmetic_key).filter(Boolean);
      const cosmetics = keys.length ? await this.cosmetics.getByKeys(keys) : [];
      const byKey = new Map((cosmetics || []).map((c) => [String(c.key), c]));

      const owned = (ownedRows || []).map((r) => {
        const key = String(r?.cosmetic_key || "");
        if (!key) return null;
        const c = byKey.get(key) || null;
        return {
          key,
          type: c?.type || null,
          name: c?.name || key,
          asset_url: c?.asset_url || null,
          rarity: c?.rarity || null,
          unlocked_at: r?.unlocked_at || null,
        };
      }).filter(Boolean);

      return res.json({
        success: true,
        data: {
          preferences: prefs || { user_id, avatar_frame_key: null, terminal_skin_id: null },
          owned_cosmetics: owned || [],
        },
      });
    } catch (err) {
      console.error("Error fetching cosmetics:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to fetch cosmetics" });
    }
  }

  async updatePreferences(req, res) {
    try {
      const user_id = res.locals.user_id;
      if (!user_id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const avatar_frame_key = Object.prototype.hasOwnProperty.call(req.body || {}, "avatar_frame_key")
        ? (req.body?.avatar_frame_key ? String(req.body.avatar_frame_key) : null)
        : undefined;

      const terminal_skin_id = Object.prototype.hasOwnProperty.call(req.body || {}, "terminal_skin_id")
        ? (req.body?.terminal_skin_id ? String(req.body.terminal_skin_id) : null)
        : undefined;

      if (avatar_frame_key === undefined && terminal_skin_id === undefined) {
        return res.status(400).json({ success: false, message: "No fields provided" });
      }

      const ownedKeys = new Set((await this.userCosmetics.listKeysByUserId(user_id)) || []);

      const wantedKeys = [avatar_frame_key, terminal_skin_id].filter(Boolean);
      const wantedCosmetics = wantedKeys.length ? await this.cosmetics.getByKeys(wantedKeys) : [];
      const byKey = new Map((wantedCosmetics || []).map((c) => [String(c.key), c]));

      if (avatar_frame_key) {
        if (!ownedKeys.has(String(avatar_frame_key))) {
          return res.status(403).json({ success: false, message: "You don't own that avatar frame" });
        }
        const c = byKey.get(String(avatar_frame_key));
        if (c && String(c.type) !== "avatar_frame") {
          return res.status(400).json({ success: false, message: "Selected cosmetic is not an avatar frame" });
        }
      }

      if (terminal_skin_id) {
        if (!ownedKeys.has(String(terminal_skin_id))) {
          return res.status(403).json({ success: false, message: "You don't own that terminal theme" });
        }
        const c = byKey.get(String(terminal_skin_id));
        if (c && String(c.type) !== "terminal_skin") {
          return res.status(400).json({ success: false, message: "Selected cosmetic is not a terminal theme" });
        }
      }

      await this.userPreferences.ensureRow(user_id);
      let updated = await this.userPreferences.getByUserId(user_id);

      if (avatar_frame_key !== undefined) {
        updated = await this.userPreferences.setAvatarFrame({ user_id, avatar_frame_key });
      }
      if (terminal_skin_id !== undefined) {
        updated = await this.userPreferences.setTerminalSkin({ user_id, terminal_skin_id });
      }

      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error("Error updating preferences:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to update preferences" });
    }
  }
}

export default CosmeticsController;
