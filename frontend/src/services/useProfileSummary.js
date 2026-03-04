import { useEffect, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios"; // or wherever your auth hook is

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
    if (!isAuthenticated) return;    // ⛔ don't fetch if not logged in

    let isMounted = true;

    const fetchSummary = async () => {
      try {
        const response = await axiosPrivate.get("/v1/account/summary");

        if (!isMounted) return;

        if (response.data?.success) {
          setSummary({
            totalXp: response.data.totalXp || 0,
            badgeCount: response.data.badgeCount || 0,
          });
        }
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