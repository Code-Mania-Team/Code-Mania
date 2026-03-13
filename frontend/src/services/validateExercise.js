import { axiosPublic } from "../api/axios";

const useValidateExercise = () => {

  const validateExercise = async (questId, output, code) => {

    if (!questId) return null;

    try {

      const response = await axiosPublic.post(
        "/v1/exercises/validate",
        {
          questId,
          output,
          code
        }
      );

      return response.data;

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