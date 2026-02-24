import { useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useStartExam = () => {
  const axiosPrivate = useAxiosPrivate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startExam = async (language) => {
    if (!language || loading) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await axiosPrivate.post(
        `/v1/exam/attempts/start-by-language?language=${language}`
      );

      const attemptId = response?.data?.data?.attemptId;

      if (!attemptId) {
        throw new Error("No attemptId returned");
      }

      return attemptId;

    } catch (err) {
      console.error("Start exam failed:", err);
      setError(
        err?.response?.data?.message || "Failed to start exam"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    startExam,
    loading,
    error
  };
};

export default useStartExam;