import { useState, useEffect, useCallback } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetAchievements = () => {
  const axiosPrivate = useAxiosPrivate();

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
        console.error("Error fetching achievements:", err);
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    loading,
    error,
    refetch: fetchAchievements
  };
};

export default useGetAchievements;
