import { useCallback, useEffect, useState } from "react";
import { axiosPublic } from "../api/axios";

const useGetPublicAchievements = (username) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    const handle = String(username || "").trim();
    if (!handle) {
      setAchievements([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axiosPublic.get(
        `/v1/account/public/${encodeURIComponent(handle)}/achievements`
      );

      if (res.data?.success) {
        setAchievements(res.data.data || []);
      } else {
        setAchievements([]);
      }
    } catch (err) {
      setError(err);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { achievements, loading, error, refetch: fetch };
};

export default useGetPublicAchievements;
