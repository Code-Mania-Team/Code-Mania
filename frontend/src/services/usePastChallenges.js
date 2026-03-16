import { useCallback, useEffect, useState } from "react";
import { axiosPublic } from "../api/axios";

const usePastChallenges = ({ limit = 30 } = {}) => {
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPast = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosPublic.get("/v1/weekly-tasks/past", {
        params: { limit },
      });
      if (res.data?.success) {
        setPast(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setPast([]);
        setError(res.data?.message || "Failed to load past challenges");
      }
    } catch (err) {
      setPast([]);
      setError(err?.response?.data?.message || err?.message || "Failed to load past challenges");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPast();
  }, [fetchPast]);

  return { past, loading, error, refetch: fetchPast };
};

export default usePastChallenges;
