import { useState, useEffect, useCallback } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios"; // adjust path if needed

const useGetAchievements = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isAuthenticated, isLoading } = useAuth();

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosPrivate.get("/v1/achievements");

      if (response.data?.success) {
        setAchievements(response.data.data || []);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setAchievements([]);
      } else {
        // Optional: reduce console noise
        // console.error("Error fetching achievements:", err);
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    // 🚫 Wait for authentication to resolve
    if (isLoading) return;
    if (!isAuthenticated) return;

    fetchAchievements();
  }, [fetchAchievements, isAuthenticated, isLoading]);

  return {
    achievements,
    loading,
    error,
    refetch: fetchAchievements
  };
};

export default useGetAchievements;