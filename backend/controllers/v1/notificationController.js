import Notification from "../../models/notification.js";

class NotificationController {
  constructor() {
    this.model = new Notification();
  }

  // ── Get all notifications for the logged-in user ─────────────
  async getNotifications(req, res) {
    try {
      const user_id = res.locals.user_id;
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
