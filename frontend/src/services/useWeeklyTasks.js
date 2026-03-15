import { useState, useEffect, useCallback } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios";
import { axiosPublic } from "../api/axios";

const useWeeklyTasks = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActiveTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = isAuthenticated
        ? await axiosPrivate.get("/v1/weekly-tasks/active")
        : await axiosPublic.get("/v1/weekly-tasks/active");
      if (res.data?.success) {
        setTasks(res.data.data || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching weekly tasks:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to fetch tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, isAuthenticated]);

  useEffect(() => {
    fetchActiveTasks();
  }, [fetchActiveTasks]);

  const acceptTask = async (task_id) => {
    try {
      const res = await axiosPrivate.post(`/v1/weekly-tasks/${task_id}/accept`);
      if (res.data?.success) {
        // Update local state
        setTasks((prev) =>
          prev.map((t) =>
            t.task_id === task_id ? { ...t, userStatus: "in_progress" } : t
          )
        );
        return res.data;
      }
    } catch (err) {
      console.error("Error accepting task:", err);
      throw err;
    }
  };

  const completeTask = async (task_id) => {
    try {
      const res = await axiosPrivate.post(`/v1/weekly-tasks/${task_id}/complete`);
      if (res.data?.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.task_id === task_id ? { ...t, userStatus: "completed" } : t
          )
        );
        return res.data;
      }
    } catch (err) {
      console.error("Error completing task:", err);
      throw err;
    }
  };

  return { tasks, loading, error, refetch: fetchActiveTasks, acceptTask, completeTask };
};

export default useWeeklyTasks;
