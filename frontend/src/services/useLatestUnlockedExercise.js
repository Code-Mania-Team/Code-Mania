import { useEffect, useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useLatestUnlockedExercise = (languageId) => {
  const axiosPrivate = useAxiosPrivate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!languageId) return;

    const fetchLatest = async () => {
      try {
        const response = await axiosPrivate.get(
          `/v1/exercises/programming-language/${languageId}/latest`
        );

        setExercise(response.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, [languageId]);

  return { exercise, loading };
};

export default useLatestUnlockedExercise;
