import SideQuest from "../../models/sideQuest.js";

class SideQuestController {
  constructor() {
    this.model = new SideQuest();
  }

  isQuestActiveNow(quest) {
    if (!quest) return false;
    if (quest.is_active === false) return false;

    const now = Date.now();
    const startsAt = quest.starts_at ? new Date(quest.starts_at).getTime() : null;
    const expiresAt = quest.expires_at ? new Date(quest.expires_at).getTime() : null;

    if (Number.isFinite(startsAt) && now < startsAt) return false;
    if (Number.isFinite(expiresAt) && now > expiresAt) return false;
    return true;
  }

  async createQuest(req, res) {
    try {
      const user_id = res.locals.user_id;
      const {
        tag,
        title,
        description,
        task,
        reward_xp,
        difficulty,
        language,
        programming_language_id,
        starter_code,
        test_cases,
        solution_code,
        min_xp_required,
        starts_at,
        expires_at,
      } = req.body || {};

      if (!title || !description) {
        return res
          .status(400)
          .json({ success: false, message: "Title and description are required." });
      }

      const quest = await this.model.createQuest({
        tag,
        title,
        description,
        task,
        reward_xp,
        difficulty,
        language,
        programming_language_id,
        starter_code,
        test_cases,
        solution_code,
        min_xp_required,
        starts_at,
        expires_at,
        created_by: user_id,
      });

      return res.json({
        success: true,
        message: "Side quest created successfully",
        data: quest,
      });
    } catch (err) {
      console.error("Error creating side quest:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to create side quest.",
      });
    }
  }

  async updateQuest(req, res) {
    try {
      const { quest_id } = req.params;
      const fields = req.body || {};

      const quest = await this.model.updateQuest(Number(quest_id), fields);
      if (!quest) {
        return res.status(404).json({ success: false, message: "Side quest not found." });
      }

      return res.json({ success: true, message: "Side quest updated", data: quest });
    } catch (err) {
      console.error("Error updating side quest:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to update side quest.",
      });
    }
  }

  async deleteQuest(req, res) {
    try {
      const { quest_id } = req.params;
      await this.model.deleteQuest(Number(quest_id));
      return res.json({ success: true, message: "Side quest deleted" });
    } catch (err) {
      console.error("Error deleting side quest:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to delete side quest.",
      });
    }
  }

  async getAllQuests(req, res) {
    try {
      const quests = await this.model.getAllQuests();
      return res.json({ success: true, data: quests });
    } catch (err) {
      console.error("Error fetching all side quests:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch side quests.",
      });
    }
  }

  async getActiveQuests(req, res) {
    try {
      const role = String(res.locals.role || "").toLowerCase();
      const user_id = await this.model.resolveActorUserId({
        user_id: res.locals.user_id,
        email: res.locals.email,
        username: res.locals.username,
      });
      const quests = await this.model.getActiveQuests({
        programming_language_id: req.query?.programming_language_id,
        language: req.query?.language,
      });
      const progress = role === "admin" || !user_id
        ? []
        : await this.model.getUserQuestProgress(user_id);

      const progressMap = {};
      for (const p of progress) {
        progressMap[p.quest_id] = p;
      }

      const safeQuests = (quests || []).map((quest) => {
        const { solution_code, ...safe } = quest || {};
        return {
          ...safe,
          userStatus: progressMap[quest.quest_id]?.status || "not_started",
          completedAt: progressMap[quest.quest_id]?.completed_at || null,
          xpAwarded: progressMap[quest.quest_id]?.xp_awarded || 0,
        };
      });

      return res.json({ success: true, data: safeQuests });
    } catch (err) {
      console.error("Error fetching active side quests:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch side quests.",
      });
    }
  }

  async getQuest(req, res) {
    try {
      const role = String(res.locals.role || "").toLowerCase();
      const user_id = await this.model.resolveActorUserId({
        user_id: res.locals.user_id,
        email: res.locals.email,
        username: res.locals.username,
      });
      const questId = Number(req.params.quest_id);
      if (!Number.isFinite(questId)) {
        return res.status(400).json({ success: false, message: "Invalid quest_id" });
      }

      const quest = await this.model.getQuestById(questId);
      if (!quest) {
        return res.status(404).json({ success: false, message: "Side quest not found" });
      }

      if (role !== "admin" && !this.isQuestActiveNow(quest)) {
        return res.status(404).json({ success: false, message: "Side quest not found" });
      }

      const progress = role !== "admin" && user_id
        ? await this.model.getUserSideQuestProgress({ userId: user_id, questId })
        : null;

      const { solution_code, ...safe } = quest;
      return res.json({
        success: true,
        data: {
          ...safe,
          userStatus: progress?.status || "not_started",
          completedAt: progress?.completed_at || null,
          xpAwarded: progress?.xp_awarded || 0,
        },
      });
    } catch (err) {
      console.error("Error fetching side quest:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch side quest.",
      });
    }
  }

  async acceptQuest(req, res) {
    try {
      const role = String(res.locals.role || "").toLowerCase();
      const user_id = await this.model.resolveActorUserId({
        user_id: res.locals.user_id,
        email: res.locals.email,
        username: res.locals.username,
      });
      const questId = Number(req.params.quest_id);
      if (!Number.isFinite(questId)) {
        return res.status(400).json({ success: false, message: "Invalid quest_id" });
      }
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: "Unable to resolve authenticated user for side quest progress.",
        });
      }

      const quest = await this.model.getQuestById(questId);
      if (!quest) {
        return res.status(404).json({ success: false, message: "Side quest not found" });
      }
      if (!this.isQuestActiveNow(quest)) {
        return res.status(403).json({
          success: false,
          message: "Side quest is not currently active.",
        });
      }

      if (role === "admin") {
        const now = new Date().toISOString();
        return res.json({
          success: true,
          message: "Admin preview: side quest accepted (not persisted)",
          data: {
            user_id,
            quest_id: questId,
            status: "in_progress",
            completed_at: null,
            xp_awarded: 0,
            updated_at: now,
            simulated: true,
          },
        });
      }

      const result = await this.model.acceptQuest(user_id, questId);
      return res.json({ success: true, message: "Side quest accepted", data: result });
    } catch (err) {
      console.error("Error accepting side quest:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to accept side quest.",
      });
    }
  }

  async completeQuest(req, res) {
    try {
      const role = String(res.locals.role || "").toLowerCase();
      const user_id = await this.model.resolveActorUserId({
        user_id: res.locals.user_id,
        email: res.locals.email,
        username: res.locals.username,
      });
      const questId = Number(req.params.quest_id);
      if (!Number.isFinite(questId)) {
        return res.status(400).json({ success: false, message: "Invalid quest_id" });
      }
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: "Unable to resolve authenticated user for side quest progress.",
        });
      }

      const quest = await this.model.getQuestById(questId);
      if (!quest) {
        return res.status(404).json({ success: false, message: "Side quest not found" });
      }
      if (!this.isQuestActiveNow(quest)) {
        return res.status(403).json({
          success: false,
          message: "Side quest is not currently active.",
        });
      }

      if (role === "admin") {
        const now = new Date().toISOString();
        return res.json({
          success: true,
          message: "Admin preview: side quest completed (not persisted)",
          data: {
            user_id,
            quest_id: questId,
            status: "completed",
            completed_at: now,
            xp_awarded: Math.max(0, Number(quest?.reward_xp || 0)),
            updated_at: now,
            simulated: true,
          },
        });
      }

      // Never trust client XP payload.
      const safeXp = Math.max(0, Number(quest?.reward_xp || 0));

      const result = await this.model.completeQuest(user_id, questId, safeXp);
      return res.json({ success: true, message: "Side quest completed!", data: result });
    } catch (err) {
      console.error("Error completing side quest:", err);

      if (String(err?.message || "").includes("must be accepted")) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: err.message || "Failed to complete side quest.",
      });
    }
  }
}

export default SideQuestController;
