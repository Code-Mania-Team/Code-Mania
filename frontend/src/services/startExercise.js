import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useStartExercise = () => {
  const axiosPrivate = useAxiosPrivate();

  const startExercise = async (questId) => {
    const response = await axiosPrivate.post("/v1/exercises/start", {
      questId,
    });

    return response.data;
  };

  return startExercise;
};

export default useStartExercise;
