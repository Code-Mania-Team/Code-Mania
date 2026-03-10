import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetExamAttempts = () => {
  const axiosPrivate = useAxiosPrivate();

  const getExamAttempts = async ({ limit = 50, language, problemId } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (language) params.set("language", String(language));
    if (problemId) params.set("problemId", String(problemId));

    const response = await axiosPrivate.get(`/v1/exam/attempts?${params.toString()}`);
    return response?.data || null;
  };

  return getExamAttempts;
};

export default useGetExamAttempts;
