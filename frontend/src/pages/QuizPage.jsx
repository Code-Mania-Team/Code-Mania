import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import styles from "../styles/QuizPage.module.css";
import { getExamData } from "../data/examData";

const QuizPage = () => {
  const navigate = useNavigate();
  const { language, quizId } = useParams();
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Map language to Cloudinary GIF
  const languageBackgrounds = {
    python: "https://res.cloudinary.com/daegpuoss/image/upload/v1771179249/python_gclhhq.gif",
    javascript: "https://res.cloudinary.com/daegpuoss/image/upload/v1771179249/javascript_uenmcw.gif",
    cpp: "https://res.cloudinary.com/daegpuoss/image/upload/v1771179249/cpp_your_cpp_gif.gif"
  };

  const heroBackground = languageBackgrounds[language] || languageBackgrounds.python;

  // Quiz questions based on quiz ID
  const getQuizQuestions = (language, quizId) => {
    const examData = getExamData(language);
    const allQuestions = examData.questions;
    
    // Map quiz IDs to question ranges
    const quizMappings = {
      101: { start: 0, end: 3, title: "Hello World Quiz" },    // Questions 1-3
      102: { start: 3, end: 7, title: "Variables & Data Types Quiz" }, // Questions 4-7  
      103: { start: 7, end: 10, title: "Control Flow Quiz" },  // Questions 8-10
      104: { start: 10, end: 14, title: "Loops Quiz" }        // Questions 11-14 (adjust as needed)
    };

    const mapping = quizMappings[parseInt(quizId)];
    if (!mapping) return null;

    return {
      ...examData,
      examTitle: mapping.title,
      questions: allQuestions.slice(mapping.start, mapping.end)
    };
  };

  useEffect(() => {
    const data = getQuizQuestions(language, quizId);
    if (!data) {
      navigate('/learn/python'); // Redirect if quiz not found
      return;
    }
    
    setQuizData(data);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setCorrectAnswers(0);
    setQuizCompleted(false);
    setAnswers(new Array(data.questions.length).fill(null));

    // Add class to body for quiz page styling
    document.body.classList.add('exam-page');
    
    return () => {
      document.body.classList.remove('exam-page');
    };
  }, [language, quizId, navigate]);

  useEffect(() => {
    if (quizCompleted) {
      document.body.classList.add('exam-results');
    } else {
      document.body.classList.remove('exam-results');
    }
  }, [quizCompleted]);

  const handleAnswerSelect = (answerIndex) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    const isCorrect = answerIndex === quizData.questions[currentQuestion].correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
    }

    // Auto-advance after short delay to show feedback
    setTimeout(() => {
      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setQuizCompleted(true);
      }
    }, 1000);
  };

  const calculateScore = () => {
    const percentage = Math.round((correctAnswers / quizData.questions.length) * 100);
    const totalExp = correctAnswers * 100;
    
    return {
      correct: correctAnswers,
      total: quizData.questions.length,
      percentage,
      totalExp
    };
  };

  const handleReturnToCourse = () => {
    navigate(`/learn/${language}`);
  };

  if (!quizData) {
    return <div>Loading...</div>;
  }

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
            minHeight: "100vh"
          }}
        >
          <div className={styles.heroContent}>
            <div className={styles.resultsContainer}>
              <h1 className={styles.resultsTitle}>Quiz Completed!</h1>
              <div className={styles.scoreDisplay}>
                <div className={styles.percentage}>{score.percentage}%</div>
              </div>

              <div className={styles.resultsDetails}>
                <p>
                  Correct Answers: {score.correct}/{score.total}
                </p>
                <p>
                  Score: {score.totalExp}/
                  {quizData.questions.reduce((sum, q) => sum + (q.exp || 100), 0)}
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

  const question = quizData.questions[currentQuestion];

  return (
    <div className={styles.page}>
      <div 
        className={styles.hero}
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className={styles.heroContent}>
          <div className={styles.heroContentInner}>
            <h1 className={styles.heroTitle}>{quizData.examTitle}</h1>
            <p className={styles.heroDescription}>
              Question {currentQuestion + 1} of {quizData.questions.length}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.questionContainer}>
          <div className={styles.questionHeader}>
            <h2 className={styles.questionTitle}>Question {currentQuestion + 1}</h2>
            <span className={styles.questionPoints}>100 XP</span>
          </div>
          
          <p className={styles.questionText}>{question.question}</p>
          
          <div className={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <div key={index} className={`${styles.option} ${
                selectedAnswer === index ? styles.selected : ''
              } ${
                showFeedback
                  ? index === question.correctAnswer
                    ? styles.correct
                    : selectedAnswer === index
                    ? styles.incorrect
                    : ''
                  : ''
              } ${
                showFeedback ? styles.disabled : ''
              }`} onClick={() => handleAnswerSelect(index)}>
                <div className={styles.optionLetter}>{String.fromCharCode(65 + index)}</div>
                <div className={styles.optionText}>{option}</div>
                {showFeedback && index === question.correctAnswer && (
                  <CheckCircle style={{ color: '#10b981', marginLeft: 'auto' }} />
                )}
                {showFeedback && selectedAnswer === index && index !== question.correctAnswer && (
                  <XCircle style={{ color: '#ef4444', marginLeft: 'auto' }} />
                )}
              </div>
            ))}
          </div>

          <div className={styles.quizNavigation}>
            <div className={styles.questionCounter}>
              {currentQuestion + 1} / {quizData.questions.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
