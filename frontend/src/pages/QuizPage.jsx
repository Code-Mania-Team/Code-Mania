import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { useQuiz } from "../hooks/useQuiz";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios";
import AuthLoadingOverlay from "../components/AuthLoadingOverlay";
import ExamCodeTerminal from "../components/ExamCodeTerminal";
import useGetExercises from "../services/getExercise";
import useGetGameProgress from "../services/getGameProgress";
import styles from "../styles/QuizPage.module.css";
import examStyles from "../styles/ExamPage.module.css";
import MarkdownRenderer from "../components/MarkdownRenderer";

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
  const [codeResult, setCodeResult] = useState(null);
  const [serverCompletion, setServerCompletion] = useState(null);

  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [mobileTab, setMobileTab] = useState("learn");

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobileView) {
      setMobileTab("learn");
    }
  }, [isMobileView]);

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

  const sanitizeColor = (value) => {
    const s = String(value || "").trim();
    if (!s) return null;

    // Allow hex (#rgb, #rrggbb, #rrggbbaa)
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return s;

    // Allow rgb/rgba()
    if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(s)) return s;

    // Allow a small set of named colors
    const allowed = new Set([
      "white",
      "black",
      "red",
      "green",
      "blue",
      "yellow",
      "orange",
      "gray",
      "grey",
      "cyan",
      "magenta",
    ]);
    if (allowed.has(s.toLowerCase())) return s;

    return null;
  };

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
    if (quizData?.quiz_type === "code" && codeResult) {
      return {
        correct: codeResult.passed_tests || 0,
        total: codeResult.total_tests || 0,
        percentage: codeResult.score_percentage || 0,
        totalExp: codeResult.earned_xp || 0,
        maxExp: quizData.exp_total || 0,
      };
    }

    const percentage = Math.round(
      (correctAnswers / quizData.questions.length) * 100
    );

    const totalExp = correctAnswers * 100;

    return {
      correct: correctAnswers,
      total: quizData.questions.length,
      percentage,
      totalExp,
      maxExp: quizData.questions.reduce((sum, q) => sum + (q.exp || 100), 0)
    };
  };

  const handleCodeSubmit = async (code, lang) => {
    try {
      const { data } = await axiosPrivate.post(
        `/v1/quizzes/${language}/${quizId}/complete`,
        { code }
      );
      setServerCompletion(data);
      return data;
    } catch (err) {
      console.error("Quiz submission failed:", err);
      throw err;
    }
  };

  const handleCodeResult = (result) => {
    setCodeResult(result);
    if (result.passed || result.score_percentage >= 70) {
      setQuizCompleted(true);
    }
  };

  /* ---------------------------------
     Submit Quiz + Store XP
  ----------------------------------- */
  useEffect(() => {
    if (!quizCompleted || !quizData || quizData.quiz_type === "code") return;

    if (isAdmin) return;

    const submitQuiz = async () => {
      try {
        const score = calculateScore();

        const res = await axiosPrivate.post(
          `/v1/quizzes/${language}/${quizId}/complete`,
          {
            score_percentage: score.percentage,
            total_correct: score.correct,
            total_questions: score.total,
            earned_xp: score.totalExp,
          }
        );

        setServerCompletion(res?.data || null);
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

  if (quizData?.quiz_type !== "code" && (!Array.isArray(quizData?.questions) || quizData.questions.length === 0)) {
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

  if (quizData?.quiz_type === "code" && !quizCompleted) {
    return (
      <div className={examStyles.page}>
        {isMobileView && (
          <div className={examStyles.sideBookmarks} role="tablist" aria-label="Exam panels">
            <button
              type="button"
              className={`${examStyles.bookmarkBtn} ${mobileTab === "learn" ? examStyles.bookmarkBtnActive : ""}`}
              onClick={() => setMobileTab("learn")}
              aria-selected={mobileTab === "learn"}
            >
              Learn
            </button>
            <button
              type="button"
              className={`${examStyles.bookmarkBtn} ${mobileTab === "code" ? examStyles.bookmarkBtnActive : ""}`}
              onClick={() => setMobileTab("code")}
              aria-selected={mobileTab === "code"}
            >
              Code
            </button>
            <button
              type="button"
              className={`${examStyles.bookmarkBtn} ${mobileTab === "output" ? examStyles.bookmarkBtnActive : ""}`}
              onClick={() => setMobileTab("output")}
              aria-selected={mobileTab === "output"}
            >
              Output
            </button>
          </div>
        )}

        <section
          className={examStyles.hero}
          style={{
            backgroundImage: `url('${heroBackground}')`,
            backgroundSize: "cover",
            backgroundPosition: "center 62%",
            height: "200px"
          }}
        >
          <div className={examStyles.heroContent}>
            <h1 className={examStyles.heroTitle}>{quizData.quiz_title}</h1>
          </div>
        </section>

        <div className={examStyles.section}>
          <div className={examStyles.questionContainer}>
            <div className={examStyles.questionHeader}>
              <h2 className={examStyles.questionTitle}>Coding Exercise</h2>
              <span className={examStyles.questionPoints}>
                {quizData.exp_total || 500} XP
              </span>
            </div>

            <div className={examStyles.examLayout}>
              <div
                className={`${examStyles.examInfoColumn} ${isMobileView && mobileTab !== "learn" ? examStyles.mobilePanelHidden : ""}`}
              >
                <div className={examStyles.questionText}>
                  {typeof quizData.code_prompt === "object" && quizData.code_prompt !== null && quizData.code_prompt.sections ? (
                    quizData.code_prompt.sections.map((section, index) => {
                      const sectionColor = sanitizeColor(section?.color);

                      if (section.type === "heading") {
                        const Tag = `h${section.level || 2}`;
                        return (
                          <Tag
                            key={index}
                            style={{
                              marginTop: index === 0 ? "0" : "1.5rem",
                              marginBottom: "0.75rem",
                              color: sectionColor || "#f1f5f9",
                              fontWeight: "700"
                            }}
                          >
                            {section.content}
                          </Tag>
                        );
                      }

                      if (section.type === "paragraph") {
                        return (
                          <p
                            key={index}
                            style={{
                              marginBottom: "0.75rem",
                              color: sectionColor || "#cbd5e1",
                              lineHeight: "1.6"
                            }}
                          >
                            {section.content}
                          </p>
                        );
                      }

                      if (section.type === "list") {
                        const ListTag = section.style === "number" ? "ol" : "ul";

                        return (
                          <div
                            key={index}
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "8px",
                              padding: "0.75rem 1rem",
                              marginBottom: "1rem"
                            }}
                          >
                            <ListTag
                              style={{
                                paddingLeft: "1.2rem",
                                lineHeight: "1.7",
                                color: sectionColor || "#cbd5e1",
                              }}
                            >
                              {section.items.map((item, i) => (
                                <li key={i} style={{ marginBottom: "0.4rem" }}>
                                  {item}
                                </li>
                              ))}
                            </ListTag>
                          </div>
                        );
                      }

                      return null;
                    })
                  ) : (
                    <MarkdownRenderer className={examStyles.lcDescription}>
                      {typeof quizData.code_prompt === "string"
                        ? quizData.code_prompt
                        : JSON.stringify(quizData.code_prompt)}
                    </MarkdownRenderer>
                  )}
                </div>
              </div>

              <div
                className={`${examStyles.examCodeColumn} ${isMobileView && mobileTab === "learn" ? examStyles.mobilePanelHidden : ""}`}
              >
                <ExamCodeTerminal 
                  language={language}
                  initialCode={quizData.starting_code}
                  testCases={quizData.test_cases}
                  attemptId={`quiz_${language}_${quizId}`}
                  submitAttempt={handleCodeSubmit}
                  onResult={handleCodeResult}
                  attemptNumber={1} 
                  isAdmin={isAdmin}
                  isMobileView={isMobileView}
                  mobilePanel={mobileTab}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------
     Results Screen
  ----------------------------------- */
  if (quizCompleted) {
    const score = calculateScore();
    const alreadyCompleted = Boolean(serverCompletion?.already_completed || codeResult?.already_completed);
    const xpEarnedRaw = serverCompletion?.earned_xp ?? codeResult?.earned_xp ?? score.totalExp;
    const xpEarned = alreadyCompleted ? 0 : Number(xpEarnedRaw || 0);
    const practiceXp = Number(serverCompletion?.practice_earned_xp ?? codeResult?.practice_earned_xp ?? 0);

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
                {alreadyCompleted ? "Practice Complete" : "Quiz Completed!"}
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
                  XP Earned: {xpEarned}{alreadyCompleted ? " (practice)" : ""}
                </p>
                {alreadyCompleted && Number.isFinite(practiceXp) && practiceXp > 0 ? (
                  <p>
                    Practice XP (not granted): {practiceXp}
                  </p>
                ) : null}
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
