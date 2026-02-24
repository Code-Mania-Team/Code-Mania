import { Code } from "lucide-react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useValidateExercise = () => {
  const axiosPrivate = useAxiosPrivate();

  const validateExercise = async (questId, output, code) => {
    if (!questId) return null;

    try {
      const response = await axiosPrivate.post(
        "/v1/exercises/validate",
        {
          questId,
          output,
          code
        }
      );

      return response.data; // 🔥 same structure style
    } catch (err) {
      return {
        success: false,
        message:
          err.response?.data?.message ||
          "Validation server error"
      };
    }
  };

  return validateExercise;
};

export default useValidateExercise;
