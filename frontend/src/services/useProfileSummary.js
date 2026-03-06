import { useEffect, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios"; // or wherever your auth hook is

const SUMMARY_CACHE_TTL_MS = 30000;
let summaryCache = {
  data: null,
  fetchedAt: 0,
  promise: null,
};

const useProfileSummary = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isAuthenticated, isLoading } = useAuth();

  const [summary, setSummary] = useState({
    totalXp: 0,
    badgeCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoading) return;           // ⛔ wait for auth check
    if (!isAuthenticated) {
      setLoading(false);
      setSummary({ totalXp: 0, badgeCount: 0 });
      summaryCache = { data: null, fetchedAt: 0, promise: null };
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchSummary = async () => {
      const now = Date.now();
      const hasFreshCache =
        summaryCache.data &&
        now - summaryCache.fetchedAt < SUMMARY_CACHE_TTL_MS;

      if (hasFreshCache) {
        if (isMounted) {
          setSummary(summaryCache.data);
          setLoading(false);
        }
        return;
      }

      try {
        if (!summaryCache.promise) {
          summaryCache.promise = axiosPrivate
            .get("/v1/account/summary")
            .then((response) => {
              const next = response.data?.success
                ? {
                    totalXp: response.data.totalXp || 0,
                    badgeCount: response.data.badgeCount || 0,
                  }
                : { totalXp: 0, badgeCount: 0 };

              summaryCache = {
                data: next,
                fetchedAt: Date.now(),
                promise: null,
              };
              return next;
            })
            .catch((err) => {
              summaryCache = { ...summaryCache, promise: null };
              throw err;
            });
        }

        const next = await summaryCache.promise;

        if (!isMounted) return;
        setSummary(next);
      } catch (err) {
        if (!isMounted) return;

        // Optional: remove noisy console log
        // console.error("Profile summary error:", err);

        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [axiosPrivate, isAuthenticated, isLoading]);

  return {
    totalXp: summary.totalXp,
    badgeCount: summary.badgeCount,
    loading,
    error,
  };
};

export default useProfileSummary;
