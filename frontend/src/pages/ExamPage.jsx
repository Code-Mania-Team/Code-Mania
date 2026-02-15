import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import styles from "../styles/ExamPage.module.css";
import { getExamData } from "../data/examData";

const ExamPage = () => {
  const navigate = useNavigate();
  const { language } = useParams(); // python, cpp, javascript
  const [examData, setExamData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [examCompleted, setExamCompleted] = useState(false);

  useEffect(() => {
    const data = getExamData(language); // Fetch exam questions for this language
    setExamData(data);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setCorrectAnswers(0);
    setExamCompleted(false);
    setAnswers(new Array(data.questions.length).fill(null));

    // Add class to body for exam styling
    document.body.classList.add("exam-page");

    return () => {
      document.body.classList.remove("exam-page");
    };
  }, [language]);

  useEffect(() => {
    if (examCompleted) {
      document.body.classList.add("exam-results");
    } else {
      document.body.classList.remove("exam-results");
    }

    return () => {
      document.body.classList.remove("exam-results");
    };
  }, [examCompleted]);

  if (!examData) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Loading Exam...</h1>
          </div>
        </section>
      </div>
    );
  }

  const heroTitle = `${examData.examTitle || `${examData.title} Exam`}`;
  const heroDescription =
    examData.examDescription ||
    "Complete the questions below to see how well you know the material!";

  const question = examData.questions[currentQuestion];

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswer(optionIndex);
    setShowFeedback(true);

    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);

    if (optionIndex === examData.questions[questionIndex].correctAnswer) {
      setCorrectAnswers(correctAnswers + 1);
    }

    // Auto-advance to next question or finish
    setTimeout(() => {
      if (currentQuestion < examData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(newAnswers[currentQuestion + 1]);
        setShowFeedback(false);
      } else {
        setExamCompleted(true);
      }
    }, 1500);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < examData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1]);
      setShowFeedback(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
      setShowFeedback(false);
    }
  };

  const calculateScore = () => {
    return examData.questions.reduce((total, q, i) => {
      return total + (answers[i] === q.correctAnswer ? q.points : 0);
    }, 0);
  };

  const totalQuestions = examData.questions.length;

  // Show results after exam completed
  if (examCompleted) {
    const totalCorrect = answers.filter(
      (a, i) => a === examData.questions[i].correctAnswer
    ).length;
    const percentage = Math.round((totalCorrect / totalQuestions) * 100);
    const passed = percentage >= 70;

    return (
      <div className={styles.page}>
        <section
          className={styles.hero}
          style={{
            backgroundImage: `url('/assets/${language}.gif')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Exam Completed!</h1>
            <p className={styles.heroDescription}>
              You have completed the {heroTitle}.
            </p>

            <div className={styles.resultsContainer}>
              <div className={styles.scoreDisplay}>
                <div className={styles.percentage}>{percentage}%</div>
                <div
                  className={styles.resultStatus}
                  style={{ color: passed ? "#10b981" : "#ef4444" }}
                >
                  {passed ? "PASSED" : "FAILED"}
                </div>
              </div>

              <div className={styles.resultsDetails}>
                <p>
                  Correct Answers: {totalCorrect}/{totalQuestions}
                </p>
                <p>
                  Score: {calculateScore()}/
                  {examData.questions.reduce((sum, q) => sum + q.points, 0)}
                  points
                </p>
              </div>

              <button
                className={styles.button}
                style={{ marginTop: "2rem", maxWidth: "300px" }}
                onClick={() =>
                  navigate(`/learn/${examData.route || language || "python"}`)
                }
              >
                Back to Course
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero/Header */}
      <section
        className={styles.hero}
        style={{
          backgroundImage: `url('/assets/${language}.gif')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className={styles.heroContent}>
          <p className={styles.heroSubtitle}>Test Your Skills in</p>
          <h1 className={styles.heroTitle}>{heroTitle}</h1>
          <p className={styles.heroDescription}>{heroDescription}</p>
        </div>
      </section>

      {/* Exam Section */}
      <section className={styles.section}>
        <div className={styles.questionContainer}>
          <div className={styles.questionHeader}>
            <h2 className={styles.questionTitle}>
              Question {currentQuestion + 1}
            </h2>
            <span className={styles.questionPoints}>{question.points} pts</span>
          </div>

          <p className={styles.questionText}>{question.question}</p>

          <div className={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              return (
                <label
                  key={index}
                  className={`${styles.optionLabel} ${
                    showCorrect ? styles.correctOption : ""
                  } ${showWrong ? styles.wrongOption : ""}`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={isSelected}
                    onChange={() =>
                      handleAnswerSelect(currentQuestion, index)
                    }
                    disabled={showFeedback}
                    className={styles.optionInput}
                  />
                  <div className={styles.optionContent}>
                    <span className={styles.optionLetter}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className={styles.optionText}>{option}</span>
                    {showCorrect && (
                      <CheckCircle
                        className={styles.feedbackIcon}
                        style={{ color: "#10b981" }}
                      />
                    )}
                    {showWrong && (
                      <XCircle
                        className={styles.feedbackIcon}
                        style={{ color: "#ef4444" }}
                      />
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExamPage;
