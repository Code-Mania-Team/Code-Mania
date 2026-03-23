import Cosmetics from "../../models/cosmetics.js";
import cloudinary from "../../core/cloudinaryClient.js";

const ALLOWED_TYPES = new Set(["avatar_frame", "terminal_skin"]);

function parseBoolean(input) {
  if (typeof input === "boolean") return input;
  if (typeof input !== "string") return undefined;

  const value = input.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

class AdminCosmeticsController {
  constructor() {
    this.cosmetics = new Cosmetics();
  }

  async list(req, res) {
    try {
      const type = typeof req.query.type === "string" ? req.query.type.trim() : undefined;
      const enabled = parseBoolean(req.query.enabled);

      if (type && !ALLOWED_TYPES.has(type)) {
        return res.status(400).json({ success: false, message: "Invalid cosmetic type" });
      }

      const rows = await this.cosmetics.listAll({ type, enabled });
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({ success: false, message: error?.message || "Failed to list cosmetics" });
    }
  }

  async create(req, res) {
    try {
      const key = String(req.body?.key || "").trim();
      const type = String(req.body?.type || "").trim();
      const name = String(req.body?.name || "").trim();
      const asset_url = String(req.body?.asset_url || "").trim();
      const rarity = String(req.body?.rarity || "epic").trim() || "epic";
      const enabled = typeof req.body?.enabled === "boolean" ? req.body.enabled : true;

      if (!key || !type || !name || !asset_url) {
        return res.status(400).json({
          success: false,
          message: "key, type, name, and asset_url are required",
        });
      }

      if (!ALLOWED_TYPES.has(type)) {
        return res.status(400).json({ success: false, message: "Invalid cosmetic type" });
      }

      const existing = await this.cosmetics.getByKey(key);
      if (existing) {
        return res.status(409).json({ success: false, message: "Cosmetic key already exists" });
      }

      const created = await this.cosmetics.create({
        key,
        type,
        name,
        asset_url,
        rarity,
        enabled,
      });

      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      return res.status(500).json({ success: false, message: error?.message || "Failed to create cosmetic" });
    }
  }

  async uploadImage(req, res) {
    try {
      if (cloudinary.__unconfigured) {
        return res.status(500).json({
          success: false,
          message: "Cloudinary is not configured on the server",
        });
      }

      const file = req.file;
      if (!file?.buffer) {
        return res.status(400).json({
          success: false,
          message: "image file is required (field name: image)",
        });
      }

      const typeRaw = String(req.body?.type || "").trim();
      const safeType = ALLOWED_TYPES.has(typeRaw) ? typeRaw : "misc";
      const baseFolder = process.env.CLOUDINARY_COSMETICS_FOLDER || "code-mania/cosmetics";
      const folder = `${baseFolder}/${safeType}`;

      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            overwrite: false,
          },
          (err, result) => {
            if (err) return reject(err);
            return resolve(result);
          }
        );

        stream.end(file.buffer);
      });

      return res.status(200).json({
        success: true,
        message: "Cosmetic image uploaded",
        data: {
          url: uploaded?.secure_url || uploaded?.url || null,
          public_id: uploaded?.public_id || null,
          bytes: uploaded?.bytes || null,
          width: uploaded?.width || null,
          height: uploaded?.height || null,
          format: uploaded?.format || null,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Failed to upload cosmetic image",
      });
    }
  }

  async update(req, res) {
    try {
      const key = String(req.params.key || "").trim();
      if (!key) {
        return res.status(400).json({ success: false, message: "Invalid key" });
      }

      const patch = {};

      if (Object.prototype.hasOwnProperty.call(req.body || {}, "name")) {
        const name = String(req.body?.name || "").trim();
        if (!name) {
          return res.status(400).json({ success: false, message: "name cannot be empty" });
        }
        patch.name = name;
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, "asset_url")) {
        const asset_url = String(req.body?.asset_url || "").trim();
        if (!asset_url) {
          return res.status(400).json({ success: false, message: "asset_url cannot be empty" });
        }
        patch.asset_url = asset_url;
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, "rarity")) {
        patch.rarity = String(req.body?.rarity || "").trim() || "epic";
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, "enabled")) {
        if (typeof req.body?.enabled !== "boolean") {
          return res.status(400).json({ success: false, message: "enabled must be boolean" });
        }
        patch.enabled = req.body.enabled;
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, "type")) {
        const type = String(req.body?.type || "").trim();
        if (!ALLOWED_TYPES.has(type)) {
          return res.status(400).json({ success: false, message: "Invalid cosmetic type" });
        }
        patch.type = type;
      }

      if (!Object.keys(patch).length) {
        return res.status(400).json({ success: false, message: "No valid fields provided" });
      }

      const existing = await this.cosmetics.getByKey(key);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Cosmetic not found" });
      }

      const updated = await this.cosmetics.updateByKey(key, patch);
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      return res.status(500).json({ success: false, message: error?.message || "Failed to update cosmetic" });
    }
  }

  async remove(req, res) {
    try {
      const key = String(req.params.key || "").trim();
      if (!key) {
        return res.status(400).json({ success: false, message: "Invalid key" });
      }

      const deleted = await this.cosmetics.deleteByKey(key);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Cosmetic not found" });
      }

      return res.status(200).json({ success: true, data: deleted });
    } catch (error) {
      return res.status(500).json({ success: false, message: error?.message || "Failed to delete cosmetic" });
    }
  }
}

export default AdminCosmeticsController;
