import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { useQuiz } from "../hooks/useQuiz";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios";
import AuthLoadingOverlay from "../components/AuthLoadingOverlay";
import useGetExercises from "../services/getExercise";
import useGetGameProgress from "../services/getGameProgress";
import styles from "../styles/QuizPage.module.css";

const QuizPage = () => {
  const navigate = useNavigate();
  const { language, quizId } = useParams();

  const { quizData, loading } = useQuiz(language, quizId);
  const axiosPrivate = useAxiosPrivate();
  const { user } = useAuth();
  const getExercises = useGetExercises();
  const getGameProgress = useGetGameProgress();
  const isAdmin = user?.role === "admin";

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const languageToId = {
    python: 1,
    cpp: 2,
    javascript: 3,
  };

  const languageBackgrounds = {
    python:
      "https://res.cloudinary.com/daegpuoss/image/upload/v1771179249/python_gclhhq.gif",
    javascript:
      "https://res.cloudinary.com/daegpuoss/image/upload/v1771179249/javascript_uenmcw.gif",
    cpp:
      "https://res.cloudinary.com/daegpuoss/image/upload/v1771565944/Cpp_nvtgy7.gif",
  };

  const heroBackground =
    languageBackgrounds[language] || languageBackgrounds.python;

  useEffect(() => {
    let cancelled = false;

    const verifyAccess = async () => {
      setAccessLoading(true);

      if (isAdmin) {
        if (!cancelled) {
          setHasAccess(true);
          setAccessLoading(false);
        }
        return;
      }

      const languageId = languageToId[language];
      const moduleId = Number(quizId);

      if (!languageId || !Number.isInteger(moduleId) || moduleId < 1 || moduleId > 4) {
        if (!cancelled) {
          setHasAccess(false);
          setAccessLoading(false);
        }
        navigate(`/learn/${language || "python"}`, { replace: true });
        return;
      }

      try {
        const [exercises, progress] = await Promise.all([
          getExercises(languageId),
          getGameProgress(languageId),
        ]);

        const completedQuests = new Set((progress?.completedQuests || []).map(Number));
        const completedQuizStages = progress?.completedQuizStages || [];

        const startOrder = (moduleId - 1) * 4 + 1;
        const endOrder = startOrder + 3;

        const moduleExercises = (exercises || []).filter((exercise) => {
          const order = Number(exercise.order_index || 0);
          return order >= startOrder && order <= endOrder;
        });

        const moduleCompleted =
          moduleExercises.length > 0 &&
          moduleExercises.every((exercise) => completedQuests.has(Number(exercise.id)));

        const allowed = completedQuizStages.includes(moduleId) || moduleCompleted;

        if (!cancelled) {
          setHasAccess(allowed);
          setAccessLoading(false);
        }

        if (!allowed) {
          navigate(`/learn/${language}`, { replace: true });
        }
      } catch (error) {
        if (!cancelled) {
          setHasAccess(false);
          setAccessLoading(false);
        }
        navigate(`/learn/${language}`, { replace: true });
      }
    };

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [language, quizId, navigate, isAdmin]);

  /* ---------------------------------
     Initialize Quiz
  ----------------------------------- */
  useEffect(() => {
    if (quizData && quizData.questions) {
      setAnswers(new Array(quizData.questions.length).fill(null));
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setCorrectAnswers(0);
      setQuizCompleted(false);
      document.body.classList.add("exam-page");
    }

    return () => {
      document.body.classList.remove("exam-page");
    };
  }, [quizData]);

  useEffect(() => {
    if (quizCompleted) {
      document.body.classList.add("exam-results");
    } else {
      document.body.classList.remove("exam-results");
    }
  }, [quizCompleted]);

  /* ---------------------------------
     Handle Answer Selection
  ----------------------------------- */
  const handleAnswerSelect = (answerIndex) => {
    if (showFeedback) return;

    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    const correctIndex =
      Number(quizData.questions[currentQuestion].correctanswer) - 1;

    const isCorrect = answerIndex === correctIndex;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setQuizCompleted(true);
      }
    }, 1000);
  };

  /* ---------------------------------
     Calculate Score
  ----------------------------------- */
  const calculateScore = () => {
    const percentage = Math.round(
      (correctAnswers / quizData.questions.length) * 100
    );

    const totalExp = correctAnswers * 100;

    return {
      correct: correctAnswers,
      total: quizData.questions.length,
      percentage,
      totalExp,
    };
  };

  /* ---------------------------------
     Submit Quiz + Store XP
  ----------------------------------- */
  useEffect(() => {
    if (!quizCompleted || !quizData) return;

    if (isAdmin) return;

    const submitQuiz = async () => {
      try {
        const score = calculateScore();

        await axiosPrivate.post(
          `/v1/quizzes/${language}/${quizId}/complete`,
          {
            score_percentage: score.percentage,
            total_correct: score.correct,
            total_questions: score.total,
            earned_xp: score.totalExp,
          }
        );
      } catch (err) {
        console.error("Quiz submission failed:", err);
      }
    };

    submitQuiz();
  }, [quizCompleted, quizData, isAdmin, language, quizId]);

  const handleReturnToCourse = () => {
    navigate(`/learn/${language}`);
  };

  if (loading || accessLoading) return <AuthLoadingOverlay />;

  if (!hasAccess) return null;

  if (!Array.isArray(quizData?.questions) || quizData.questions.length === 0) {
    return (
      <div className={styles.page}>
        <div
          className={styles.hero}
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          <div className={styles.heroContent}>
            <div className={styles.heroContentInner}>
              <h1 className={styles.heroTitle}>
                {quizData?.quiz_title}
              </h1>
              <p className={styles.heroDescription}>
                No questions found for this quiz.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <button
            className={styles.actionButton}
            onClick={handleReturnToCourse}
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------
     Results Screen
  ----------------------------------- */
  if (quizCompleted) {
    const score = calculateScore();

    return (
      <div className={styles.page}>
        <section
          className={styles.hero}
          style={{
            backgroundImage: `url('${heroBackground}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "100vh",
          }}
        >
          <div className={styles.heroContent}>
            <div className={styles.resultsContainer}>
              <h1 className={styles.resultsTitle}>
                Quiz Completed!
              </h1>

              <div className={styles.scoreDisplay}>
                <div className={styles.percentage}>
                  {score.percentage}%
                </div>
              </div>

              <div className={styles.resultsDetails}>
                <p>
                  Correct Answers: {score.correct}/{score.total}
                </p>
                <p>
                  Score: {score.totalExp}/
                  {quizData.questions.reduce(
                    (sum, q) => sum + (q.exp || 100),
                    0
                  )}{" "}
                  EXP
                </p>
              </div>

              <button
                className={styles.actionButton}
                onClick={handleReturnToCourse}
              >
                Back to Course
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ---------------------------------
     Quiz UI
  ----------------------------------- */
  const question = quizData.questions[currentQuestion];
  const correctIndex = Number(question.correctanswer) - 1;

  return (
    <div className={styles.page}>
      <div
        className={styles.hero}
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className={styles.heroContent}>
          <div className={styles.heroContentInner}>
            <h1 className={styles.heroTitle}>
              {quizData.quiz_title}
            </h1>
            <p className={styles.heroDescription}>
              Question {currentQuestion + 1} of{" "}
              {quizData.questions.length}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.questionContainer}>
          <div className={styles.questionHeader}>
            <h2 className={styles.questionTitle}>
              Question {currentQuestion + 1}
            </h2>
            <span className={styles.questionPoints}>
              {question.exp || 100} XP
            </span>
          </div>

          <p className={styles.questionText}>
            {question.question}
          </p>

          <div className={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`${styles.option} ${
                  selectedAnswer === index ? styles.selected : ""
                } ${
                  showFeedback
                    ? index === correctIndex
                      ? styles.correct
                      : selectedAnswer === index
                      ? styles.incorrect
                      : ""
                    : ""
                } ${showFeedback ? styles.disabled : ""}`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className={styles.optionLetter}>
                  {String.fromCharCode(65 + index)}
                </div>

                <div className={styles.optionText}>
                  {option}
                </div>

                {showFeedback && index === correctIndex && (
                  <CheckCircle
                    style={{ color: "#10b981", marginLeft: "auto" }}
                  />
                )}

                {showFeedback &&
                  selectedAnswer === index &&
                  index !== correctIndex && (
                    <XCircle
                      style={{ color: "#ef4444", marginLeft: "auto" }}
                    />
                  )}
              </div>
            ))}
          </div>

          <div className={styles.quizNavigation}>
            <div className={styles.questionCounter}>
              {currentQuestion + 1} /{" "}
              {quizData.questions.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
