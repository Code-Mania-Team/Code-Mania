import { axiosPublic } from "../api/axios";

const useGetExerciseById = () => {
  const getExerciseById = async (exerciseId) => {
    if (!exerciseId) return null;

    const response = await axiosPublic.get(
      `/v1/exercises/${exerciseId}`
    );

    return response.data.data; // 🔥 same structure
  };

  return getExerciseById;
};

export default useGetExerciseById;
