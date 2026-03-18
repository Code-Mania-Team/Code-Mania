import { axiosPublic } from "../api/axios";

const useStartExercise = () => {
  const startExercise = async (questId) => {
    const response = await axiosPublic.post(
      "/v1/exercises/start",
      { questId }
    );


    return response.data;
  };

  return startExercise;
};

export default useStartExercise;
