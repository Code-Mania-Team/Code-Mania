import WeeklyTask from "../../models/weeklyTask.js";
import WeeklyTaskService from "../../services/weeklyTaskService.js";
import cloudinary from "../../core/cloudinaryClient.js";
import Cosmetics from "../../models/cosmetics.js";

class WeeklyTaskController {
  constructor() {
    this.model = new WeeklyTask();
    this.service = new WeeklyTaskService();
    this.cosmetics = new Cosmetics();
  }

  async getUsedRewardKeys({ excludeTaskId = null } = {}) {
    return this.model.listRewardCosmeticKeys({ excludeTaskId });
  }

  pickRandom(list) {
    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async enrichRewardCosmetic(tasks) {
    const list = Array.isArray(tasks) ? tasks : [];
    const keys = Array.from(
      new Set(
        list
          .flatMap((t) => [t?.reward_avatar_frame_key, t?.reward_terminal_skin_id])
          .filter(Boolean)
          .map((k) => String(k))
      )
    );

    if (!keys.length) return list;
    const cosmetics = await this.cosmetics.getByKeys(keys);
    const byKey = new Map((cosmetics || []).map((c) => [String(c.key), c]));

    return list.map((t) => {
      const key = t?.reward_avatar_frame_key || t?.reward_terminal_skin_id || null;
      const c = key ? byKey.get(String(key)) : null;
      return {
        ...t,
        reward_cosmetic: c
          ? { key: c.key, type: c.type, name: c.name, asset_url: c.asset_url, rarity: c.rarity }
          : null,
      };
    });
  }

  async ensureHardTaskReward(task) {
    const taskId = Number(task?.task_id);
    if (!Number.isFinite(taskId) || taskId <= 0) return task;

    const diff = String(task?.difficulty || "").toLowerCase();
    if (diff !== "hard") return task;

    const hasReward = Boolean(task?.reward_avatar_frame_key || task?.reward_terminal_skin_id);
    if (hasReward) return task;

    const enabled = await this.cosmetics.listEnabledByTypes(["avatar_frame", "terminal_skin"]);
    const used = await this.getUsedRewardKeys({ excludeTaskId: taskId });
    const frames = (enabled || []).filter((c) => c.type === "avatar_frame" && c.key && !used.has(String(c.key)));
    const skins = (enabled || []).filter((c) => c.type === "terminal_skin" && c.key && !used.has(String(c.key)));

    // Prefer unique frames; allow skins when frames are exhausted.
    const pickFrom = frames.length ? frames : skins;
    if (!pickFrom.length) return task;

    const picked = this.pickRandom(pickFrom);
    if (!picked) return task;
    const reward_avatar_frame_key = picked.type === "avatar_frame" ? picked.key : null;
    const reward_terminal_skin_id = picked.type === "terminal_skin" ? picked.key : null;

    const updated = await this.model.updateTask(taskId, {
      reward_avatar_frame_key,
      reward_terminal_skin_id,
    });

    return updated || task;
  }

  pickDeterministicRewardKey({ taskId, enabledCosmetics }) {
    const list = Array.isArray(enabledCosmetics) ? enabledCosmetics : [];
    const frames = list.filter((c) => c?.type === "avatar_frame" && c?.key);
    const skins = list.filter((c) => c?.type === "terminal_skin" && c?.key);
    if (!frames.length && !skins.length) return null;

    // Deterministic 80/20 split based on task id.
    const useSkin = skins.length > 0 && taskId % 5 === 0;
    const pool = useSkin ? skins : (frames.length ? frames : skins);
    if (!pool.length) return null;

    return String(pool[taskId % pool.length].key);
  }

  async withVirtualReward(task) {
    if (!task) return task;
    const diff = String(task?.difficulty || "").toLowerCase();
    if (diff !== "hard") return task;

    const hasReward = Boolean(task?.reward_avatar_frame_key || task?.reward_terminal_skin_id);
    if (hasReward) return task;

    const taskId = Number(task?.task_id);
    if (!Number.isFinite(taskId) || taskId <= 0) return task;

    const enabled = await this.cosmetics.listEnabledByTypes(["avatar_frame", "terminal_skin"]);
    const used = await this.getUsedRewardKeys({ excludeTaskId: taskId });
    const filtered = (enabled || []).filter((c) => c?.key && !used.has(String(c.key)));
    const pool = filtered.length ? filtered : enabled;
    const rewardKey = this.pickDeterministicRewardKey({ taskId, enabledCosmetics: pool });
    if (!rewardKey) return task;

    const cosmetic = (pool || []).find((c) => String(c.key) === String(rewardKey)) || null;
    return {
      ...task,
      reward_avatar_frame_key: cosmetic?.type === "avatar_frame" ? rewardKey : null,
      reward_terminal_skin_id: cosmetic?.type === "terminal_skin" ? rewardKey : null,
      reward_cosmetic: cosmetic
        ? { key: cosmetic.key, type: cosmetic.type, name: cosmetic.name, asset_url: cosmetic.asset_url, rarity: cosmetic.rarity }
        : null,
    };
  }

  // ── Admin: create a weekly task ──────────────────────────────
  async createTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const { title, description, reward_xp, difficulty, language, programming_language_id, starter_code, test_cases, solution_code, min_xp_required, starts_at, expires_at, cover_image, reward_avatar_frame_key, reward_terminal_skin_id } = req.body || {};

      if (!title || !description) {
        return res.status(400).json({ success: false, message: "Title and description are required." });
      }

      const diff = String(difficulty || "medium").toLowerCase();

      // Cosmetics rewards: only hard challenges. Easy/medium are XP-only.
      let finalRewardAvatar = reward_avatar_frame_key || null;
      let finalRewardSkin = reward_terminal_skin_id || null;

      if (diff !== "hard") {
        finalRewardAvatar = null;
        finalRewardSkin = null;
      } else {
        const used = await this.getUsedRewardKeys();

        if ((finalRewardAvatar && used.has(String(finalRewardAvatar))) || (finalRewardSkin && used.has(String(finalRewardSkin)))) {
          return res.status(409).json({
            success: false,
            message: "This cosmetic prize is already used by another weekly challenge. Weekly cosmetic prizes must be unique.",
          });
        }

        // If no reward provided, randomize one from cosmetics.
        if (!finalRewardAvatar && !finalRewardSkin) {
          const enabled = await this.cosmetics.listEnabledByTypes(["avatar_frame", "terminal_skin"]);
          const frames = (enabled || []).filter((c) => c.type === "avatar_frame" && c.key && !used.has(String(c.key)));
          const skins = (enabled || []).filter((c) => c.type === "terminal_skin" && c.key && !used.has(String(c.key)));

          // Prefer frames; allow skins only when frames are exhausted.
          const pickFrom = frames.length ? frames : skins;
          const picked = this.pickRandom(pickFrom);
          if (!picked) {
            return res.status(409).json({
              success: false,
              message: "No unused cosmetic prizes available. Add more cosmetics or choose a different reward.",
            });
          }

          if (picked.type === "terminal_skin") finalRewardSkin = picked.key;
          else finalRewardAvatar = picked.key;
        }
      }

      const task = await this.model.createTask({
        title,
        description,
        reward_xp,
        difficulty: diff,
        language,
        programming_language_id,
        starter_code,
        test_cases,
        solution_code,
        cover_image,
        min_xp_required,
        starts_at,
        expires_at,
        created_by: user_id,
        reward_avatar_frame_key: finalRewardAvatar,
        reward_terminal_skin_id: finalRewardSkin,
      });

      const enriched = await this.enrichRewardCosmetic([task]);
      res.json({ success: true, message: "Weekly task created successfully", data: enriched[0] || task });
    } catch (err) {
      console.error("Error creating weekly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to create weekly task." });
    }
  }

  // ── Admin: upload cover image (Cloudinary) ───────────────────
  async uploadCoverImage(req, res) {
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

      const folder = process.env.CLOUDINARY_WEEKLY_TASKS_FOLDER || "code-mania/weekly-tasks";

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

      return res.json({
        success: true,
        message: "Cover image uploaded",
        data: {
          url: uploaded?.secure_url || uploaded?.url || null,
          public_id: uploaded?.public_id || null,
          bytes: uploaded?.bytes || null,
          width: uploaded?.width || null,
          height: uploaded?.height || null,
          format: uploaded?.format || null,
        },
      });
    } catch (err) {
      console.error("Error uploading weekly task cover image:", err);
      return res.status(500).json({
        success: false,
        message: err?.message || "Failed to upload image",
      });
    }
  }

  // ── Admin: update a weekly task ──────────────────────────────
  async updateTask(req, res) {
    try {
      const { task_id } = req.params;
      const fields = req.body || {};

      const taskIdNum = Number(task_id);
      if (Object.prototype.hasOwnProperty.call(fields, "reward_avatar_frame_key") || Object.prototype.hasOwnProperty.call(fields, "reward_terminal_skin_id")) {
        const used = await this.getUsedRewardKeys({ excludeTaskId: taskIdNum });
        const nextAvatar = fields.reward_avatar_frame_key || null;
        const nextSkin = fields.reward_terminal_skin_id || null;

        if ((nextAvatar && used.has(String(nextAvatar))) || (nextSkin && used.has(String(nextSkin)))) {
          return res.status(409).json({
            success: false,
            message: "This cosmetic prize is already used by another weekly challenge. Weekly cosmetic prizes must be unique.",
          });
        }
      }

      const task = await this.model.updateTask(taskIdNum, fields);
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found." });
      }

      res.json({ success: true, message: "Weekly task updated", data: task });
    } catch (err) {
      console.error("Error updating weekly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to update weekly task." });
    }
  }

  // ── Admin: delete a weekly task ──────────────────────────────
  async deleteTask(req, res) {
    try {
      const { task_id } = req.params;
      await this.model.deleteTask(Number(task_id));
      res.json({ success: true, message: "Weekly task deleted" });
    } catch (err) {
      console.error("Error deleting weekly task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to delete weekly task." });
    }
  }

  // ── Admin: get all tasks ─────────────────────────────────────
  async getAllTasks(req, res) {
    try {
      const tasks = await this.model.getAllTasks();
      res.json({ success: true, data: tasks });
    } catch (err) {
      console.error("Error fetching all tasks:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to fetch tasks." });
    }
  }

  // ── User: get active tasks (only if user has 5k+ XP) ────────
  async getActiveTasks(req, res) {
    try {
      const user_id = res.locals.user_id || null;
      const baseTasks = await this.model.getActiveTasks();
      const tasks = await Promise.all(
        (baseTasks || []).map(async (t) => {
          const ensured = await this.ensureHardTaskReward(t);
          return this.withVirtualReward(ensured);
        })
      );
      const progress = user_id ? await this.model.getUserTaskProgress(user_id) : [];

      // Map progress onto tasks
      const progressMap = {};
      for (const p of progress) {
        progressMap[p.task_id] = p;
      }

      const tasksWithProgress = (tasks || []).map((task) => {
        const { solution_code, ...safe } = task || {};
        return {
          ...safe,
          userStatus: progressMap[task.task_id]?.status || "not_started",
          completedAt: progressMap[task.task_id]?.completed_at || null,
          xpAwarded: progressMap[task.task_id]?.xp_awarded || 0,
        };
      });

      // Only enrich rows that don't already have an attached reward_cosmetic
      const missing = tasksWithProgress.filter((t) => !t?.reward_cosmetic);
      const enriched = await this.enrichRewardCosmetic(missing);
      const byId = new Map((enriched || []).map((t) => [Number(t.task_id), t]));
      const merged = tasksWithProgress.map((t) => (t?.reward_cosmetic ? t : (byId.get(Number(t.task_id)) || t)));
      res.json({ success: true, data: merged });
    } catch (err) {
      console.error("Error fetching active tasks:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to fetch tasks." });
    }
  }

  // ── User: fetch one weekly task (safe) ───────────────────────
  async getTask(req, res) {
    try {
      const user_id = res.locals.user_id || null;
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      // Backfill hard reward once so the UI can show a stable prize.
      const base = await this.model.getTaskById(taskId);
      if (base) {
        await this.ensureHardTaskReward(base);
      }

      const task = await this.service.getTaskSafe({ taskId, userId: user_id });
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      const withReward = await this.withVirtualReward(task);
      if (withReward?.reward_cosmetic) {
        return res.json({ success: true, data: withReward });
      }

      const enriched = await this.enrichRewardCosmetic([withReward]);
      return res.json({ success: true, data: enriched[0] || withReward });
    } catch (err) {
      console.error("Error fetching weekly task:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to fetch task." });
    }
  }

  // ── User: validate weekly task code (no rewards) ─────────────
  async validateTask(req, res) {
    try {
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const code = req.body?.code;
      if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ success: false, message: "code is required" });
      }

      const result = await this.service.validate({ taskId, code });
      if (!result.ok) {
        return res.status(result.status || 500).json({ success: false, message: result.message });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      console.error("Error validating weekly task:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to validate task." });
    }
  }

  // ── User: submit weekly task code (runs tests) ───────────────
  async submitTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const code = req.body?.code;
      if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ success: false, message: "code is required" });
      }

      const result = await this.service.submit({ userId: user_id, taskId, code });
      if (!result.ok) {
        return res.status(result.status || 500).json({ success: false, message: result.message });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      console.error("Error submitting weekly task:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to submit task." });
    }
  }

  // ── Public: list past challenges w/ participants + winners ───
  async listPast(req, res) {
    try {
      const limitRaw = req.query.limit ? Number(req.query.limit) : 30;
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 30;

      const tasks = await this.model.getPastTasks({ limit });

      const enriched = await Promise.all(
        (tasks || []).map(async (t) => {
          const [participantsCount, winners] = await Promise.all([
            this.model.countParticipants({ taskId: t.task_id }),
            this.model.listWinners({ taskId: t.task_id }),
          ]);

          return {
            ...t,
            participants_count: participantsCount,
            winners: (winners || []).map((w) => ({
              user_id: w.user_id,
              rank: w.rank,
              note: w.note,
              username: w.users?.username || null,
              character_id: w.users?.character_id ?? null,
            })),
          };
        })
      );

      return res.json({ success: true, data: enriched });
    } catch (err) {
      console.error("Error listing past weekly tasks:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to fetch past challenges." });
    }
  }

  // ── Public: list participants for a past challenge ───────────
  async listParticipants(req, res) {
    try {
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const limitRaw = req.query.limit ? Number(req.query.limit) : 200;
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200;

      const rows = await this.model.listParticipants({ taskId, limit });

      const participants = (rows || []).map((r) => ({
        user_id: r.user_id,
        username: r.users?.username || null,
        character_id: r.users?.character_id ?? null,
        status: r.status,
        xp_awarded: r.xp_awarded || 0,
        completed_at: r.completed_at || null,
        created_at: r.created_at || null,
      }));

      return res.json({ success: true, data: participants });
    } catch (err) {
      console.error("Error listing weekly task participants:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to fetch participants." });
    }
  }

  // ── Public: get one past challenge w/ winners + participant count
  async getPastTask(req, res) {
    try {
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const task = await this.model.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      const now = Date.now();
      const expiresAtMs = task?.expires_at ? new Date(task.expires_at).getTime() : NaN;
      const isPast = Number.isFinite(expiresAtMs) ? expiresAtMs < now : false;
      if (!isPast) {
        return res.status(400).json({ success: false, message: "Task is not past yet" });
      }

      const [participantsCount, winners] = await Promise.all([
        this.model.countParticipants({ taskId }),
        this.model.listWinners({ taskId }),
      ]);

      // Do not expose solution_code
      const { solution_code, ...safe } = task;

      return res.json({
        success: true,
        data: {
          ...safe,
          participants_count: participantsCount,
          winners: (winners || []).map((w) => ({
            user_id: w.user_id,
            rank: w.rank,
            note: w.note,
            username: w.users?.username || null,
            character_id: w.users?.character_id ?? null,
          })),
        },
      });
    } catch (err) {
      console.error("Error fetching past weekly task:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to fetch past challenge." });
    }
  }

  // ── Admin: set winners (handpicked) ──────────────────────────
  async setWinners(req, res) {
    try {
      const pickedBy = res.locals.user_id;
      const taskId = Number(req.params.task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const winnersRaw = req.body?.winners;
      if (!Array.isArray(winnersRaw)) {
        return res.status(400).json({ success: false, message: "winners must be an array" });
      }

      // Allow sending either user_id or username.
      const wantedUsernames = winnersRaw
        .map((w) => (w?.username ? String(w.username).trim() : ""))
        .filter(Boolean);

      const users = wantedUsernames.length
        ? await this.model.getUsersByUsernames(wantedUsernames)
        : [];
      const userIdByUsername = new Map(users.map((u) => [String(u.username || "").trim(), u.user_id]));

      const normalized = winnersRaw
        .map((w, idx) => {
          const user_id = Number(w?.user_id) || userIdByUsername.get(String(w?.username || "").trim()) || null;
          const rank = w?.rank ?? idx + 1;
          const note = w?.note ?? null;
          return { user_id, rank, note };
        })
        .filter((w) => w.user_id);

      await this.model.replaceWinners({ taskId, pickedBy, winners: normalized });
      const winners = await this.model.listWinners({ taskId });

      return res.json({
        success: true,
        message: "Winners updated",
        data: (winners || []).map((w) => ({
          user_id: w.user_id,
          rank: w.rank,
          note: w.note,
          username: w.users?.username || null,
          character_id: w.users?.character_id ?? null,
        })),
      });
    } catch (err) {
      console.error("Error setting weekly task winners:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to set winners." });
    }
  }

  // ── User: accept a task ──────────────────────────────────────
  async acceptTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const { task_id } = req.params;

      const result = await this.model.acceptTask(user_id, Number(task_id));
      res.json({ success: true, message: "Task accepted", data: result });
    } catch (err) {
      console.error("Error accepting task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to accept task." });
    }
  }

  // ── User: complete a task ────────────────────────────────────
  async completeTask(req, res) {
    try {
      const user_id = res.locals.user_id;
      const { task_id } = req.params;
      const taskId = Number(task_id);
      if (!Number.isFinite(taskId)) {
        return res.status(400).json({ success: false, message: "Invalid task_id" });
      }

      const rawXp = Number(req.body?.xp_awarded ?? 0);
      const task = await this.model.getTaskById(taskId);
      const maxXp = Number(task?.reward_xp ?? 0);

      const safeXp = Number.isFinite(rawXp)
        ? Math.max(0, Math.min(rawXp, Number.isFinite(maxXp) ? maxXp : 0))
        : 0;

      const result = await this.model.completeTask(user_id, taskId, safeXp);
      res.json({ success: true, message: "Task completed!", data: result });
    } catch (err) {
      console.error("Error completing task:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to complete task." });
    }
  }
}

export default WeeklyTaskController;
