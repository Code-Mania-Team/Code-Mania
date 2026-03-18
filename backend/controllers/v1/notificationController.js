import Notification from "../../models/notification.js";
import { getTotalXpEarned } from "../../services/xpService.js";
import WeeklyTask from "../../models/weeklyTask.js";
import Cosmetics from "../../models/cosmetics.js";

class NotificationController {
  constructor() {
    this.model = new Notification();
    this.weekly = new WeeklyTask();
    this.cosmetics = new Cosmetics();
  }

  async ensureMilestones(user_id) {
    if (!user_id) return;

    const totalXp = await getTotalXpEarned(user_id);

    const milestones = [1000, 5000, 10000];
    for (const milestone of milestones) {
      if (totalXp >= milestone) {
        await this.model.createOnce({
          user_id,
          type: "xp_milestone",
          title: `Milestone reached: ${milestone.toLocaleString()} XP`,
          message: "Keep going - your next unlock is closer than you think.",
          metadata: {
            milestone_xp: milestone,
            href: "/dashboard",
          },
          dedupe_key: `xp_milestone_${milestone}`,
        });
      }
    }
  }

  async ensureWeeklyCompletions(user_id) {
    if (!user_id) return;

    // Backfill latest completed weekly tasks with a single deduped notification per task.
    const { data, error } = await this.weekly.db
      .from("user_weekly_tasks")
      .select(
        `
        task_id,
        status,
        completed_at,
        xp_awarded,
        weekly_tasks (
          task_id,
          title,
          difficulty,
          reward_xp,
          reward_avatar_frame_key,
          reward_terminal_skin_id
        )
      `
      )
      .eq("user_id", user_id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    const keys = Array.from(
      new Set(
        rows
          .map((r) => r?.weekly_tasks?.reward_avatar_frame_key || r?.weekly_tasks?.reward_terminal_skin_id)
          .filter(Boolean)
          .map((k) => String(k))
      )
    );

    const cosmetics = keys.length ? await this.cosmetics.getByKeys(keys) : [];
    const byKey = new Map((cosmetics || []).map((c) => [String(c.key), c]));

    for (const r of rows) {
      const taskId = Number(r?.task_id);
      if (!Number.isFinite(taskId) || taskId <= 0) continue;

      const xp = Number(r?.xp_awarded || r?.weekly_tasks?.reward_xp || 0);
      const rewardKey = r?.weekly_tasks?.reward_avatar_frame_key || r?.weekly_tasks?.reward_terminal_skin_id || null;
      const cosmetic = rewardKey ? byKey.get(String(rewardKey)) : null;

      const parts = [];
      if (xp) parts.push(`+${xp} XP`);
      if (cosmetic?.name) parts.push(`Unlocked: ${cosmetic.name}`);
      const message = parts.length ? `Congrats! ${parts.join(". ")}.` : "Congrats! Weekly challenge completed.";

      await this.model.createOnce({
        user_id,
        type: "system",
        title: "Weekly Challenge Complete",
        message,
        metadata: {
          kind: "weekly_challenge_complete",
          task_id: taskId,
          earned_xp: xp,
          unlocked_cosmetic_key: rewardKey,
          unlocked_cosmetic: cosmetic
            ? { key: cosmetic.key, type: cosmetic.type, name: cosmetic.name, asset_url: cosmetic.asset_url, rarity: cosmetic.rarity }
            : null,
        },
        dedupe_key: `weekly_task_complete:${taskId}`,
      });
    }
  }

  // ── Get all notifications for the logged-in user ─────────────
  async getNotifications(req, res) {
    try {
      const user_id = res.locals.user_id;

      // Backfill milestone notifications for existing users.
      try {
        await this.ensureMilestones(user_id);
      } catch (err) {
        console.error("Milestone backfill failed:", err);
      }

      // Backfill weekly completion notifications for existing users.
      try {
        await this.ensureWeeklyCompletions(user_id);
      } catch (err) {
        console.error("Weekly completion backfill failed:", err);
      }

      const notifications = await this.model.getByUser(user_id);
      const unreadCount = await this.model.getUnreadCount(user_id);

      res.json({ success: true, data: { notifications, unreadCount } });
    } catch (err) {
      console.error("Error fetching notifications:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to fetch notifications." });
    }
  }

  // ── Get unread count only ────────────────────────────────────
  async getUnreadCount(req, res) {
    try {
      const user_id = res.locals.user_id;
      const count = await this.model.getUnreadCount(user_id);

      res.json({ success: true, data: { unreadCount: count } });
    } catch (err) {
      console.error("Error fetching unread count:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to fetch unread count." });
    }
  }

  // ── Mark a single notification as read ───────────────────────
  async markAsRead(req, res) {
    try {
      const user_id = res.locals.user_id;
      const { notification_id } = req.params;

      const result = await this.model.markAsRead(Number(notification_id), user_id);
      res.json({ success: true, data: result });
    } catch (err) {
      console.error("Error marking notification as read:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to update notification." });
    }
  }

  // ── Mark all notifications as read ───────────────────────────
  async markAllAsRead(req, res) {
    try {
      const user_id = res.locals.user_id;
      await this.model.markAllAsRead(user_id);
      res.json({ success: true, message: "All notifications marked as read." });
    } catch (err) {
      console.error("Error marking all as read:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to mark all as read." });
    }
  }

  // ── Delete a notification ────────────────────────────────────
  async deleteNotification(req, res) {
    try {
      const user_id = res.locals.user_id;
      const { notification_id } = req.params;

      await this.model.deleteNotification(Number(notification_id), user_id);
      res.json({ success: true, message: "Notification deleted." });
    } catch (err) {
      console.error("Error deleting notification:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to delete notification." });
    }
  }
}

export default NotificationController;
