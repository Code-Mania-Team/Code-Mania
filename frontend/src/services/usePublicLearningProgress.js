import { useEffect, useState } from "react";
import { axiosPublic } from "../api/axios";

const usePublicLearningProgress = (username) => {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handle = String(username || "").trim();
    if (!handle) {
      setProgress([]);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    axiosPublic
      .get(`/v1/account/public/${encodeURIComponent(handle)}/learning-progress`)
      .then((res) => {
        if (!mounted) return;
        const rows = res.data?.success ? res.data?.progress : [];
        setProgress(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err);
        setProgress([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [username]);

  return { progress, loading, error };
};

export default usePublicLearningProgress;
