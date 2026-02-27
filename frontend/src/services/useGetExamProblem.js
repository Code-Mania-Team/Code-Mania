import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetExamProblem = () => {
  const axiosPrivate = useAxiosPrivate();

  const getExamProblem = async (language) => {
    try {
      const response = await axiosPrivate.get(
        `/v1/exam/problems?language=${language}`
      );

      if (!response.data?.success || !response.data?.data?.length) {
        throw new Error("Exam not found");
      }

      // 1 exam per language
      return response.data.data[0];

    } catch (error) {
      console.error("❌ Failed to fetch exam problem", error);
      throw error;
    }
  };

  return getExamProblem;
};

export default useGetExamProblem;