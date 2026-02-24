import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetExamProblem = () => {
  const axiosPrivate = useAxiosPrivate();

  const getExamProblem = async (problemId) => {
    try {
      const response = await axiosPrivate.get(
        `/v1/exam/problems/${problemId}`
      );

      console.log("📘 Exam problem fetched:", response.data);
      console.log("📘 Exam problem fetched:", response.data)   ;
      return response.data;

    } catch (error) {
      console.error("❌ Failed to fetch exam problem", error);
      throw error;
    }
  };

  return getExamProblem;
};

export default useGetExamProblem;