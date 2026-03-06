import { useEffect, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios"; // adjust path if needed

const PROGRESS_CACHE_TTL_MS = 30000;
let progressCache = {
  data: null,
  fetchedAt: 0,
  promise: null,
};

const useLearningProgress = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isAuthenticated, isLoading } = useAuth();

  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 🚫 Wait for auth to finish
    if (isLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      setProgress([]);
      progressCache = { data: null, fetchedAt: 0, promise: null };
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchProgress = async () => {
      const now = Date.now();
      const hasFreshCache =
        Array.isArray(progressCache.data) &&
        now - progressCache.fetchedAt < PROGRESS_CACHE_TTL_MS;

      if (hasFreshCache) {
        if (isMounted) {
          setProgress(progressCache.data);
          setLoading(false);
        }
        return;
      }

      try {
        if (!progressCache.promise) {
          progressCache.promise = axiosPrivate
            .get("/v1/account/learning-progress")
            .then((res) => {
              if (res.data?.success) {
                const data = res.data.progress || [];
                progressCache = {
                  data,
                  fetchedAt: Date.now(),
                  promise: null,
                };
                return data;
              }

              progressCache = { data: [], fetchedAt: Date.now(), promise: null };
              return [];
            })
            .catch((err) => {
              progressCache = { ...progressCache, promise: null };
              throw err;
            });
        }

        const data = await progressCache.promise;

        if (!isMounted) return;
        setProgress(data);
      } catch (err) {
        if (!isMounted) return;

        // Optional: remove noisy console log
        // console.error("Failed to fetch learning progress:", err);

        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProgress();

    return () => {
      isMounted = false;
    };
  }, [axiosPrivate, isAuthenticated, isLoading]);

  return { progress, loading, error };
};

export default useLearningProgress;
