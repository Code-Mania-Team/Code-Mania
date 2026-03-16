import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetExamProblem = () => {
  const axiosPrivate = useAxiosPrivate();

  const getExamProblem = async (language) => {
    try {
      const response = await axiosPrivate.get(`/v1/exam/problems?language=${language}`);

      if (!response.data?.success || !response.data?.data?.length) {
        throw new Error("Exam not found");
      }

      // 1 exam per language
      const problem = response.data.data[0];

      // Fetch safe details (includes test_cases + starting_code)
      if (problem?.id) {
        try {
          const safe = await axiosPrivate.get(`/v1/exam/problems/${problem.id}`);
          if (safe.data?.success && safe.data?.data) return safe.data.data;
        } catch (err) {
          // Fallback to list response
          console.warn("⚠️ Failed to fetch safe exam problem details", err);
        }
      }

      return problem;

    } catch (error) {
      console.error("❌ Failed to fetch exam problem", error);
      throw error;
    }
  };

  return getExamProblem;
};

export default useGetExamProblem;
