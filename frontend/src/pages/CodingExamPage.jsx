import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, Play, RotateCcw, Lightbulb } from "lucide-react";
import styles from "../styles/ExamPage.module.css";
import { getCodingExamData } from "../data/codingExamData";
import CodeTerminal from "../components/CodeTerminal";

const CodingExamPage = () => {
  const navigate = useNavigate();
  const { language } = useParams();
  const [examData, setExamData] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [userCode, setUserCode] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);

  // Map language to Cloudinary GIF
  const languageBackgrounds = {
    python:
      "https://res.cloudinary.com/daegpuoss/image/upload/v1771179249/python_gclhhq.gif",
    javascript:
      "https://res.cloudinary.com/daegpuoss/image/upload/v1771179249/javascript_uenmcw.gif",
    cpp: "https://res.cloudinary.com/daegpuoss/image/upload/v1771565944/Cpp_nvtgy7.gif",
  };

  const heroBackground =
    languageBackgrounds[language] || languageBackgrounds.python;

  useEffect(() => {
    const data = getCodingExamData(language);
    setExamData(data);
    setUserCode(data.challenges[0]?.starterCode || "");

    // Add class to body for exam page styling
    document.body.classList.add("exam-page");

    return () => {
      document.body.classList.remove("exam-page");
    };
  }, [language]);

  const runCode = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      // Simulate code execution (in real app, this would call backend)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const challenge = examData.challenges[currentChallenge];
      const isCorrect = userCode.trim() === challenge.solution.trim();

      const results = {
        passed: isCorrect,
        output: isCorrect
          ? challenge.testCases[0].expectedOutput
          : "Code doesn't match expected output",
        testCases: challenge.testCases.map((testCase) => ({
          ...testCase,
          passed: isCorrect,
          actualOutput: isCorrect
            ? testCase.expectedOutput
            : "Code doesn't match expected output",
        })),
      };

      setTestResults(results);

      if (isCorrect) {
        setCompletedChallenges([...completedChallenges, currentChallenge]);
      }
    } catch (error) {
      setTestResults({
        passed: false,
        output: "Error: " + error.message,
        testCases: challenge.testCases.map((testCase) => ({
          ...testCase,
          passed: false,
          actualOutput: "Error: " + error.message,
        })),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const nextChallenge = () => {
    if (currentChallenge < examData.challenges.length - 1) {
      setCurrentChallenge(currentChallenge + 1);
      setUserCode(examData.challenges[currentChallenge + 1]?.starterCode || "");
      setTestResults(null);
      setShowHints(false);
    } else {
      setExamCompleted(true);
    }
  };

  const resetChallenge = () => {
    setUserCode(examData.challenges[currentChallenge]?.starterCode || "");
    setTestResults(null);
  };

  const calculateScore = () => {
    const totalPoints = completedChallenges.reduce((sum, challengeId) => {
      return sum + (examData.challenges[challengeId]?.points || 0);
    }, 0);

    const maxPoints = examData.challenges.reduce(
      (sum, challenge) => sum + challenge.points,
      0,
    );
    const percentage = Math.round((totalPoints / maxPoints) * 100);

    return {
      points: totalPoints,
      maxPoints,
      percentage,
      completed: completedChallenges.length,
    };
  };

  const handleReturnToCourse = () => {
    navigate(`/learn/${language}`);
  };

  if (!examData) {
    return <div>Loading...</div>;
  }

  if (examCompleted) {
    const score = calculateScore();

    return (
      <div className={styles.page}>
        <section
          className={styles.hero}
          style={{
            backgroundImage: `url('${heroBackground}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Coding Exam Completed!</h1>
            <p className={styles.heroDescription}>
              You have completed the {examData.examTitle}.
            </p>

            <div className={styles.resultsContainer}>
              <div className={styles.scoreDisplay}>
                <div className={styles.percentage}>{score.percentage}%</div>
              </div>

              <div className={styles.resultsDetails}>
                <p>
                  Challenges Completed: {score.completed}/
                  {examData.challenges.length}
                </p>
                <p>
                  Score: {score.points}/{score.maxPoints} EXP
                </p>
              </div>

              <button
                className={styles.button}
                style={{ marginTop: "2rem", maxWidth: "300px" }}
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

  const challenge = examData.challenges[currentChallenge];

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section
        className={styles.hero}
        style={{
          backgroundImage: `url('${heroBackground}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "200px",
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{examData.examTitle}</h1>
          <p className={styles.heroDescription}>
            Challenge {currentChallenge + 1} of {examData.challenges.length}
          </p>
        </div>
      </section>

      {/* Challenge Section */}
      <div className={styles.section}>
        <div className={styles.questionContainer}>
          <div className={styles.questionHeader}>
            <h2 className={styles.questionTitle}>{challenge.title}</h2>
            <span className={styles.questionPoints}>{challenge.points} XP</span>
          </div>

          {/* Two Column Layout */}
          <div
            style={{
              display: "flex",
              gap: "2rem",
              marginBottom: "1rem",
              width: "100%",
            }}
          >
            {/* Left Column - Problem Description */}
            <div style={{ flex: "1", minWidth: "450px", maxWidth: "600px" }}>
              <p className={styles.questionText}>{challenge.description}</p>

              {/* Test Cases Display */}
              <div
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid #3b82f6",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <h4 style={{ color: "#3b82f6", marginBottom: "0.5rem" }}>
                  Test Cases:
                </h4>
                {challenge.testCases.map((testCase, index) => (
                  <div key={index} style={{ marginBottom: "0.5rem" }}>
                    <p
                      style={{
                        color: "#e2e8f0",
                        margin: "0",
                        fontSize: "0.9rem",
                      }}
                    >
                      <strong>Test {index + 1}:</strong> {testCase.description}
                    </p>
                    <p
                      style={{
                        color: "#94a3b8",
                        margin: "0.25rem 0 0 1rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Expected Output: "{testCase.expectedOutput}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Hints Section */}
              {showHints && (
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid #f59e0b",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <h4 style={{ color: "#f59e0b", marginBottom: "0.5rem" }}>
                    Hints:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                    {challenge.hints.map((hint, index) => (
                      <li
                        key={index}
                        style={{ color: "#e2e8f0", marginBottom: "0.25rem" }}
                      >
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column - Code Editor */}
            <div style={{ flex: "2", minWidth: "700px" }}>
              <CodeTerminal />
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div
              style={{
                background: testResults.passed
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${testResults.passed ? "#10b981" : "#ef4444"}`,
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                {testResults.passed ? (
                  <CheckCircle
                    style={{ color: "#10b981", marginRight: "0.5rem" }}
                  />
                ) : (
                  <XCircle
                    style={{ color: "#ef4444", marginRight: "0.5rem" }}
                  />
                )}
                <span
                  style={{
                    color: testResults.passed ? "#10b981" : "#ef4444",
                    fontWeight: "bold",
                  }}
                >
                  {testResults.passed ? "All Tests Passed!" : "Tests Failed"}
                </span>
              </div>

              {/* Detailed Test Results */}
              <div style={{ marginBottom: "1rem" }}>
                <h5 style={{ color: "#e2e8f0", marginBottom: "0.5rem" }}>
                  Test Results:
                </h5>
                {testResults.testCases.map((testCase, index) => (
                  <div
                    key={index}
                    style={{
                      background: "rgba(0, 0, 0, 0.2)",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {testCase.passed ? (
                        <CheckCircle
                          size={16}
                          style={{ color: "#10b981", marginRight: "0.5rem" }}
                        />
                      ) : (
                        <XCircle
                          size={16}
                          style={{ color: "#ef4444", marginRight: "0.5rem" }}
                        />
                      )}
                      <span style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>
                        Test {index + 1}:{" "}
                        {testCase.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <p
                      style={{
                        color: "#94a3b8",
                        margin: "0.25rem 0 0 1.5rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Expected: "{testCase.expectedOutput}"
                    </p>
                    {!testCase.passed && (
                      <p
                        style={{
                          color: "#ef4444",
                          margin: "0.25rem 0 0 1.5rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        Actual: "{testCase.actualOutput}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.examNavigation}>
            {testResults?.passed && (
              <button onClick={nextChallenge} className={styles.navButton}>
                {currentChallenge < examData.challenges.length - 1
                  ? "Next Challenge"
                  : "Finish Exam"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingExamPage;
