import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetQuizAttempts = () => {
  const axiosPrivate = useAxiosPrivate();

  const getQuizAttempts = async ({ limit = 50, language } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (language) params.set("language", String(language));

    const response = await axiosPrivate.get(`/v1/quizzes/attempts?${params.toString()}`);
    return response?.data || null;
  };

  return getQuizAttempts;
};

export default useGetQuizAttempts;
