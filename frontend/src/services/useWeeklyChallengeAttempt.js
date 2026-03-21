import { useState } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useWeeklyChallengeAttempt = () => {
  const axiosPrivate = useAxiosPrivate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async ({ taskId, code }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosPrivate.post(`/v1/weekly-tasks/${taskId}/submit`, { code });
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || "Submission failed");
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const validate = async ({ taskId, code }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosPrivate.post(`/v1/weekly-tasks/${taskId}/validate`, { code });
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || "Validation failed");
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submit, validate, loading, error };
};

export default useWeeklyChallengeAttempt;
