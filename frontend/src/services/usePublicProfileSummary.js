import { useEffect, useState } from "react";
import { axiosPublic } from "../api/axios";

const usePublicProfileSummary = (username) => {
  const [summary, setSummary] = useState({ totalXp: 0, badgeCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handle = String(username || "").trim();
    if (!handle) {
      setSummary({ totalXp: 0, badgeCount: 0 });
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    axiosPublic
      .get(`/v1/account/public/${encodeURIComponent(handle)}/summary`)
      .then((res) => {
        if (!mounted) return;
        const data = res.data || {};
        setSummary({
          totalXp: Number(data.totalXp || 0),
          badgeCount: Number(data.badgeCount || 0),
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err);
        setSummary({ totalXp: 0, badgeCount: 0 });
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [username]);

  return {
    totalXp: summary.totalXp,
    badgeCount: summary.badgeCount,
    loading,
    error,
  };
};

export default usePublicProfileSummary;
