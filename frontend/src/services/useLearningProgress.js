import { useEffect, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios"; // adjust path if needed

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
      return;
    }

    let isMounted = true;

    const fetchProgress = async () => {
      try {
        const res = await axiosPrivate.get("/v1/account/learning-progress");

        if (!isMounted) return;

        if (res.data?.success) {
          setProgress(res.data.progress || []);
        }
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