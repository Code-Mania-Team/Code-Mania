import { useState, useEffect, useCallback } from "react";
import { axiosPublic } from "../api/axios";

const useGetCourseBadges = (languageId) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBadges = useCallback(async () => {
    if (!languageId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosPublic.get(
        `/v1/achievements/course/${languageId}`
      );

      if (response.data?.success) {
        setBadges(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching course badges:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [languageId]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return {
    badges,
    loading,
    error,
    refetch: fetchBadges
  };
};

export default useGetCourseBadges;