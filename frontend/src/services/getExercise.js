import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetExercises = () => {
  const axiosPrivate = useAxiosPrivate();

  const getExercises = async (languageId) => {
    const response = await axiosPrivate.get(
      `/v1/exercises/programming-language/${languageId}`
    );

    return response.data.data;
  };

  return getExercises;
};

export default useGetExercises;
