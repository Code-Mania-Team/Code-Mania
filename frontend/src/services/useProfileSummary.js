import { useEffect, useState } from "react";

import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useProfileSummary = () => {
  const axiosPrivate = useAxiosPrivate();

  const [summary, setSummary] = useState({
    totalXp: 0,

    badgeCount: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
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

        console.error("Profile summary error:", err);

        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [axiosPrivate]);

  return {
    totalXp: summary.totalXp,

    badgeCount: summary.badgeCount,

    loading,

    error,
  };
};

export default useProfileSummary;
