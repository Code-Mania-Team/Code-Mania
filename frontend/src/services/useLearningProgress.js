import { useEffect, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useLearningProgress = () => {
  const axiosPrivate = useAxiosPrivate();

  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

        console.error("Failed to fetch learning progress:", err);
        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProgress();

    return () => {
      isMounted = false;
    };
  }, [axiosPrivate]);

  return { progress, loading, error };
};

export default useLearningProgress;
