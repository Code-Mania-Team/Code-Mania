// services/useGetExamProblemsByLanguage.js
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useGetExamProblemsByLanguage = () => {
  const axiosPrivate = useAxiosPrivate();

  const getExamProblemsByLanguage = async (languageSlug) => {
    try {
      const response = await axiosPrivate.get(
        `/v1/exam/problems?languageSlug=${languageSlug}`
      );

      if (response.data?.success) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error("❌ Failed to fetch exam problems", error);
      return [];
    }
  };

  return getExamProblemsByLanguage;
};

export default useGetExamProblemsByLanguage;