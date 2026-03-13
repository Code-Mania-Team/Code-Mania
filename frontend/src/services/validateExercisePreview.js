// import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { axiosPublic } from "../api/axios";

const useValidateExercisePreview = () => {
  // const axiosPrivate = useAxiosPrivate();


  const validateExercisePreview = async (questId, output, code) => {
    if (!questId) return null;

    try {
      const response = await axiosPublic.post(
        "/v1/exercises/validate-preview",
        {
          questId,
          output,
          code,
        }
      );

      return response.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Validation server error",
      };
    }
  };

  return validateExercisePreview;
};

export default useValidateExercisePreview;
