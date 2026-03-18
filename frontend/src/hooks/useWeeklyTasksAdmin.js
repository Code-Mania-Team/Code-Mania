import { useCallback, useMemo, useState } from "react";
import useAxiosPrivate from "./useAxiosPrivate";
import useAuth from "./useAxios";

const useWeeklyTasksAdmin = () => {
  const axiosPrivate = useAxiosPrivate();
  const { user, isAuthenticated } = useAuth();

  const isAdmin = useMemo(
    () => Boolean(isAuthenticated && user?.role === "admin"),
    [isAuthenticated, user?.role]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const guard = useCallback(() => {
    if (!isAdmin) {
      const err = new Error("Forbidden: admin access required");
      err.status = 403;
      throw err;
    }
  }, [isAdmin]);

  const getAllTasks = useCallback(async () => {
    guard();
    setLoading(true);
    setError("");
    try {
      const res = await axiosPrivate.get("/v1/weekly-tasks/all");
      return res.data?.data || [];
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to fetch tasks");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, guard]);

  const createTask = useCallback(
    async (payload) => {
      guard();
      setLoading(true);
      setError("");
      try {
        const res = await axiosPrivate.post("/v1/weekly-tasks", payload);
        return res.data;
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to create task");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosPrivate, guard]
  );

  const updateTask = useCallback(
    async ({ taskId, fields }) => {
      guard();
      setLoading(true);
      setError("");
      try {
        const res = await axiosPrivate.put(`/v1/weekly-tasks/${taskId}`, fields);
        return res.data;
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to update task");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosPrivate, guard]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      guard();
      setLoading(true);
      setError("");
      try {
        const res = await axiosPrivate.delete(`/v1/weekly-tasks/${taskId}`);
        return res.data;
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to delete task");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosPrivate, guard]
  );

  const setWinners = useCallback(
    async ({ taskId, winners }) => {
      guard();
      setLoading(true);
      setError("");
      try {
        const res = await axiosPrivate.post(`/v1/weekly-tasks/${taskId}/winners`, {
          winners,
        });
        return res.data;
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to set winners");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosPrivate, guard]
  );

  const uploadCoverImage = useCallback(
    async (file) => {
      guard();
      if (!file) {
        const err = new Error("Missing file");
        err.status = 400;
        throw err;
      }

      setLoading(true);
      setError("");
      try {
        const form = new FormData();
        form.append("image", file);
        const res = await axiosPrivate.post("/v1/weekly-tasks/cover-image", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to upload image");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [axiosPrivate, guard]
  );

  return {
    isAdmin,
    loading,
    error,
    getAllTasks,
    createTask,
    updateTask,
    deleteTask,
    setWinners,
    uploadCoverImage,
  };
};

export default useWeeklyTasksAdmin;
