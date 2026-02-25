import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../styles/ExamPage.module.css";
import { getCodingExamData } from "../data/codingExamData";
import ExamCodeTerminal from "../components/ExamCodeTerminal";
import useGetExamProblem from "../services/useGetExamProblem";
import useExamAttempt from "../services/useExamAttempt";
import useGetExercises from "../services/getExercise";
import useGetGameProgress from "../services/getGameProgress";
import AuthLoadingOverlay from "../components/AuthLoadingOverlay";
import useAuth from "../hooks/useAxios";

const CodingExamPage = () => {
  const navigate = useNavigate();
  const { language } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [examData, setExamData] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [userCode, setUserCode] = useState("");
  const getExamProblem = useGetExamProblem();
  const getExercises = useGetExercises();
  const getGameProgress = useGetGameProgress();
  const [examState, setExamState] = useState({
    attemptNumber: 1,
    score: 0,
    earnedXp: 0,
    locked: false
  });
  const {
    startAttempt,
    submitAttempt,
    attemptId
  } = useExamAttempt();
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const languageToId = {
    python: 1,
    cpp: 2,
    javascript: 3,
  };
  

  const languageBackgrounds = {
    python: "https://res.cloudinary.com/daegpuoss/image/upload/v1771179249/python_gclhhq.gif",
    javascript: "https://res.cloudinary.com/daegpuoss/image/upload/v1771179249/javascript_uenmcw.gif",
    cpp: "https://res.cloudinary.com/daegpuoss/image/upload/v1771565944/Cpp_nvtgy7.gif"
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

      if (!languageId) {
        if (!cancelled) {
          setHasAccess(false);
          setAccessLoading(false);
        }
        navigate("/learn", { replace: true });
        return;
      }

      try {
        const [exercises, progress] = await Promise.all([
          getExercises(languageId),
          getGameProgress(languageId),
        ]);

        const completedQuests = new Set((progress?.completedQuests || []).map(Number));
        const requiredExercises = (exercises || []).filter((exercise) => {
          const order = Number(exercise.order_index || 0);
          return order >= 1 && order <= 16;
        });

        const allowed =
          requiredExercises.length > 0 &&
          requiredExercises.every((exercise) => completedQuests.has(Number(exercise.id)));

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
  }, [language, navigate, isAdmin]);

  useEffect(() => {
    if (!hasAccess) return;

    const loadExam = async () => {
      try {
        const attempt = await startAttempt(language);
        if (!attempt) return;

        const problem = await getExamProblem(language);
        if (!problem) return;

        setExamData({
          examTitle: `${language.toUpperCase()} Exam`,
          challenges: [
            {
              id: problem.id,
              title: problem.problem_title,
              description: problem.problem_description,
              starterCode: problem.starting_code,
              points: problem.exp
            }
          ]
        });

        setExamState({
          attemptNumber: attempt.attempt_number,
          score: attempt.score_percentage,
          earnedXp: attempt.earned_xp,
          locked: attempt.score_percentage === 100
        });

      } catch (err) {
        console.error("Load exam error:", err);
      }
    };

    loadExam();
  }, [language, hasAccess]);

  if (accessLoading) return <AuthLoadingOverlay />;

  if (!hasAccess) return null;

  if (!examData) return <AuthLoadingOverlay />;

  const challenge = examData.challenges[currentChallenge];
  console.log("🚀 Current challenge data:", examData);

  return (
    <div className={styles.page}>
      <section
        className={styles.hero}
        style={{
          backgroundImage: `url('${heroBackground}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "200px"
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{examData.examTitle}</h1>
          <p className={styles.heroDescription}>
            Challenge {currentChallenge + 1} of {examData.challenges.length}
          </p>
        </div>
      </section>

      <div className={styles.section}>
        <div className={styles.questionContainer}>
          <div className={styles.questionHeader}>
            <h2 className={styles.questionTitle}>{challenge.title}</h2>
            <span className={styles.questionPoints}>
              {examState.earnedXp} XP
            </span>
          </div>

          <div style={{ display: "flex", gap: "2rem" }}>
            <div style={{ flex: 1 , width: "100%", height: "100%"}}>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  marginBottom: "1.2rem",
                  flexWrap: "wrap"
                }}
              >

                {/* Attempt Badge */}
                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: "999px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    background:
                      examState.attemptNumber <= 2
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(251,191,36,0.15)",
                    color:
                      examState.attemptNumber <= 2
                        ? "#22c55e"
                        : "#fbbf24",
                    border: `1px solid ${
                      examState.attemptNumber <= 2
                        ? "#22c55e"
                        : "#fbbf24"
                    }`
                  }}
                >
                  Attempt {examState.attemptNumber} {isAdmin ? "/ ∞" : "/ 5"}
                </span>

                {/* Remaining Attempts */}
                {!isAdmin && (
                  <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                    Remaining: {Math.max(0, 5 - examState.attemptNumber)}
                  </span>
                )}

                {/* Score Badge */}
                {examState.score > 0 && (
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      background:
                        examState.score === 100
                          ? "rgba(59,130,246,0.2)"
                          : "rgba(168,85,247,0.15)",
                      color:
                        examState.score === 100
                          ? "#3b82f6"
                          : "#a855f7",
                      border: `1px solid ${
                        examState.score === 100
                          ? "#3b82f6"
                          : "#a855f7"
                      }`
                    }}
                  >
                    Score: {examState.score}%
                  </span>
                )}

                {/* Locked Badge */}
                {examState.locked && (
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      background: "rgba(239,68,68,0.15)",
                      color: "#ef4444",
                      border: "1px solid #ef4444"
                    }}
                  >
                    🔒 Locked (5/5 attempts)
                  </span>
                )}
              </div>
              <div
                style={{
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  marginBottom: "1.5rem"
                }}
              >
                <h3
                  style={{
                    marginBottom: "0.6rem",
                    fontWeight: 700,
                    color: "#60a5fa"
                  }}
                >
                  📘 How This Exam Works
                </h3>

                <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.6", color: "#cbd5e1" }}>
                  <li>Your program is tested automatically using hidden test cases.</li>
                  <li>Do NOT print extra text — only print the required output.</li>
                  <li>You have a maximum of <strong>5 attempts</strong>.</li>
                  <li>The first 2 attempts have no penalty.</li>
                  <li>After that, a small 5% XP penalty applies per attempt.</li>
                  <li>Exam locks only when you use all <strong>5 attempts</strong>.</li>
                  <li>XP never decreases — improvement is always rewarded.</li>
                </ul>
              </div>
              <div className={styles.questionText}>
                {challenge.description?.sections?.map((section, index) => {

                  if (section.type === "heading") {
                    const Tag = `h${section.level}`;
                    return (
                      <Tag
                        key={index}
                        style={{
                          marginTop: index === 0 ? "0" : "1.5rem",
                          marginBottom: "0.75rem",
                          color: "#f1f5f9",
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
                          color: "#cbd5e1",
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
                        <ListTag style={{ paddingLeft: "1.2rem", lineHeight: "1.7" }}>
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
                })}
              </div>
              {showHints && (
                <div style={{ marginTop: "1rem" }}>
                  <h4>Hints:</h4>
                  <ul>
                    {challenge.hints.map((hint, index) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ flex: 2 }}>
              {attemptId ? (
                <ExamCodeTerminal
                  language={language}
                  initialCode={challenge.starterCode}
                  attemptId={attemptId}
                  submitAttempt={submitAttempt}
                  attemptNumber={examState.attemptNumber}
                  isAdmin={isAdmin}
                  locked={examState.locked}
                  onResult={(data) => {
                    setExamState({
                      attemptNumber: data.attempt_number,
                      score: data.score_percentage,
                      earnedXp: data.earned_xp,
                      locked: !isAdmin && (data.attempt_number || 0) >= 5
                    });
                  }}
                />
              ) : (
                <AuthLoadingOverlay />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingExamPage;
