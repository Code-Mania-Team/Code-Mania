import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetNextExercise = () => {
  const axiosPrivate = useAxiosPrivate();

  const getNextExercise = async (exerciseId) => {
    if (!exerciseId) return null;

    const response = await axiosPrivate.get(`/v1/exercises/${exerciseId}/next`);

    return response.data.data; // null if no next
  };

  return getNextExercise;
};

export default useGetNextExercise;
