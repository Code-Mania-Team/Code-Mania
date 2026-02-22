import { useState, useEffect } from "react";
import { axiosPublic } from "../api/axios";

export const useQuiz = (language, quizId) => {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);

        const response = await axiosPublic.get(
          `/v1/quizzes/${language}/${quizId}`,
        );

        const questions = Array.isArray(response.data?.questions)
          ? response.data.questions
          : [];

        setQuizData({
          ...response.data,
          questions,
        });

        setError(null);
      } catch (err) {
        console.error("Quiz fetch error:", err);
        setError(err.response?.data?.message || "Failed to fetch quiz");
        setQuizData({ quiz_title: "Quiz", questions: [] });
      } finally {
        setLoading(false);
      }
    };

    if (language && quizId) {
      fetchQuiz();
    }
  }, [language, quizId]);

  return { quizData, loading, error };
};
