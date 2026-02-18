import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetExercises = () => {
  const axiosPrivate = useAxiosPrivate(); // or normal axios if public

  const getExercises = async (languageId) => {
    const response = await axiosPrivate.get(
      `/v1/exercises/programming-language/${languageId}`
    );

    return response.data.data; // 🔥 IMPORTANT
  };

  return getExercises;
};

export default useGetExercises;
