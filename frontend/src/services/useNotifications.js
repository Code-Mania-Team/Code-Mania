import { useState, useEffect, useCallback } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios";

const useNotifications = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await axiosPrivate.get("/v1/notifications");
      if (res.data?.success) {
        setNotifications(res.data.data?.notifications || []);
        setUnreadCount(res.data.data?.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, isAuthenticated]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await axiosPrivate.get("/v1/notifications/unread-count");
      if (res.data?.success) {
        setUnreadCount(res.data.data?.unreadCount || 0);
      }
    } catch (err) {
      // silent fail for count polling
    }
  }, [axiosPrivate, isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll unread count every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const markAsRead = async (notification_id) => {
    try {
      await axiosPrivate.patch(`/v1/notifications/${notification_id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notification_id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosPrivate.patch("/v1/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (notification_id) => {
    try {
      await axiosPrivate.delete(`/v1/notifications/${notification_id}`);
      setNotifications((prev) =>
        prev.filter((n) => n.notification_id !== notification_id)
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

export default useNotifications;
