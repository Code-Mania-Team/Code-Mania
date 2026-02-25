import { useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useExamAttempt = () => {
  const axiosPrivate = useAxiosPrivate();

  const [attemptId, setAttemptId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ===============================
     START ATTEMPT (LANGUAGE-BASED)
  =============================== */
  const startAttempt = async (language) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosPrivate.post(
        "/v1/exam/attempts/start",
        { language } // 🔥 send language instead of problemId
      );

      if (response.data?.success) {
        const attempt = response.data.data;

        setAttemptId(attempt.id);
        setResult(attempt);

        return attempt;
      }

      throw new Error(response.data?.message || "Failed to start attempt");

    } catch (err) {
      console.error("Start attempt error:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     SUBMIT ATTEMPT
  =============================== */
  const submitAttempt = async (code) => {
    if (!attemptId) {
      const err = new Error("No active attempt");
      setError(err);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosPrivate.post(
        `/v1/exam/attempts/${attemptId}/submit`,
        { code }
      );

      if (response.data?.success) {
        setResult(response.data.data);
        return response.data.data;
      }

      throw new Error(response.data?.message || "Submission failed");

    } catch (err) {
      console.error("Submit attempt error:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAttemptId(null);
    setResult(null);
    setError(null);
  };

  return {
    attemptId,
    result,
    loading,
    error,
    startAttempt,
    submitAttempt,
    reset,
  };
};

export default useExamAttempt;