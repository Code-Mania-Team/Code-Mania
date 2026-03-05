import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetExerciseById = () => {
  const axiosPrivate = useAxiosPrivate();

  const getExerciseById = async (exerciseId) => {
    if (!exerciseId) return null;

    const response = await axiosPrivate.get(
      `/v1/exercises/${exerciseId}`
    );

    return response.data.data; // 🔥 same structure
  };

  return getExerciseById;
};

export default useGetExerciseById;
