import React, { useState, useEffect, useRef } from "react";
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
import { postAchievement } from "../services/postAchievement";

// Badge IDs for exam completion
const EXAM_BADGE_MAP = {
  python: 25,
  cpp: 26,
  javascript: 27,
};

// Badge display info
const BADGE_INFO = {
  python: {
    title: "Legend of Python",
    description: "Completed the Python Beginner Journey.",
    color: "#3CB371",
    icon: "🐍",
    image: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173773/completed-python_ngjzrm.png",
  },
  cpp: {
    title: "City of C++ Conquered",
    description: "Completed the C++ Beginner Journey.",
    color: "#5B8FB9",
    icon: "⚙️",
    image: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173778/completed-cpp_cman1f.png",
  },
  javascript: {
    title: "Mystery of JavaScript Solved",
    description: "Completed the JavaScript Beginner Journey.",
    color: "#FFD700",
    icon: "🟨",
    image: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173773/completed-javascript_kyndcw.png",
  },
};

const resolveExamXpDisplay = ({ serverXp, attemptNumber, baseXp }) => {
  const numericServerXp = Number(serverXp || 0);
  if (numericServerXp > 0) return numericServerXp;

  const numericBaseXp = Number(baseXp || 1000);
  const attemptsUsed = Math.max(0, Number(attemptNumber || 1) - 1);
  const penaltyPerFailedSubmit = Math.round(numericBaseXp * 0.05);

  return Math.max(0, numericBaseXp - (attemptsUsed * penaltyPerFailedSubmit));
};

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
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsData, setCongratsData] = useState(null);
  const [retakeMessage, setRetakeMessage] = useState("");
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [mobileTab, setMobileTab] = useState("learn");
  const badgeAwardedRef = useRef(false);

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
    document.body.classList.add("exam-page");
    document.body.classList.add("coding-exam-page");
    return () => {
      document.body.classList.remove("exam-page");
      document.body.classList.remove("coding-exam-page");
      document.body.classList.remove("exam-results");
    };
  }, []);

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
              points: Number(problem.exp || 1000)
            }
          ]
        });

        const baseXp = Number(problem.exp || 1000);

        setExamState({
          attemptNumber: attempt.attempt_number,
          score: attempt.score_percentage,
          earnedXp: resolveExamXpDisplay({
            serverXp: attempt.earned_xp,
            attemptNumber: attempt.attempt_number,
            baseXp,
          }),
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

  const handleRetake = async () => {
    try {
      const carryXp = Number(examState.earnedXp || 0);
      const attempt = await startAttempt(language, carryXp);
      if (!attempt) return;

      const baseXp = Number(challenge?.points || 1000);

      setExamState({
        attemptNumber: attempt.attempt_number,
        score: attempt.score_percentage,
        earnedXp: resolveExamXpDisplay({
          serverXp:
            Number(attempt.earned_xp || 0) > 0
              ? attempt.earned_xp
              : carryXp,
          attemptNumber: attempt.attempt_number,
          baseXp,
        }),
        locked: attempt.score_percentage === 100 || Number(attempt.attempt_number || 0) >= 5,
      });

      if (Number(attempt.attempt_number || 0) < 5) {
        setRetakeMessage("Retake started. You can try again now.");
      } else {
        setRetakeMessage("Retake is not available yet. Please refresh and try again.");
      }
    } catch (err) {
      console.error("Failed to start retake:", err);
      setRetakeMessage("Could not start retake right now. Please try again.");
    }
  };
  console.log("🚀 Current challenge data:", examData);

  return (
    <div className={styles.page}>
      {isMobileView && (
        <>
          <div className={styles.mobileTaskTabsWrap}>
            <div className={styles.mobileTaskTabs}>
              <button
                type="button"
                className={`${styles.mobileTaskTab} ${mobileTab === "learn" ? styles.mobileTaskTabActive : ""}`}
                onClick={() => setMobileTab("learn")}
              >
                Learn
              </button>
              <button
                type="button"
                className={`${styles.mobileTaskTab} ${mobileTab === "code" ? styles.mobileTaskTabActive : ""}`}
                onClick={() => setMobileTab("code")}
              >
                Code
              </button>
              <button
                type="button"
                className={`${styles.mobileTaskTab} ${mobileTab === "output" ? styles.mobileTaskTabActive : ""}`}
                onClick={() => setMobileTab("output")}
              >
                Output
              </button>
            </div>
          </div>
          <div className={styles.mobileTaskTabsOffset} />
        </>
      )}

      <section
        className={styles.hero}
        style={{
          backgroundImage: `url('${heroBackground}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 62%",
          height: "200px"
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{examData.examTitle}</h1>
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

          <div className={styles.examLayout}>
            <div
              className={`${styles.examInfoColumn} ${isMobileView && mobileTab !== "learn" ? styles.mobilePanelHidden : ""}`}
            >
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
                    border: `1px solid ${examState.attemptNumber <= 2
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
                      border: `1px solid ${examState.score === 100
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

              {!isAdmin && examState.locked && Number(examState.attemptNumber || 0) >= 5 && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.35)",
                    borderRadius: "12px",
                    padding: "0.9rem 1rem",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ color: "#fca5a5", fontWeight: 600 }}>
                    Sorry, you used all attempts. You need to retake the exam and try again.
                  </span>
                  <button
                    type="button"
                    onClick={handleRetake}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Start Retake
                  </button>
                </div>
              )}

              {retakeMessage && (
                <div style={{ color: "#fcd34d", marginBottom: "1rem", fontWeight: 600 }}>
                  {retakeMessage}
                </div>
              )}

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
                  <li>Failed submissions reduce exam XP by 5% each attempt.</li>
                  <li>Exam locks only when you use all <strong>5 attempts</strong>.</li>
                  <li>Exam starts at {Number(challenge.points || 1000)} XP.</li>
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

            <div
              className={`${styles.examCodeColumn} ${isMobileView && mobileTab === "learn" ? styles.mobilePanelHidden : ""}`}
            >
              {attemptId ? (
                <ExamCodeTerminal
                  language={language}
                  initialCode={challenge.starterCode}
                  isMobileView={isMobileView}
                  mobilePanel={mobileTab}
                  attemptId={attemptId}
                  submitAttempt={submitAttempt}
                  attemptNumber={examState.attemptNumber}
                  isAdmin={isAdmin}
                  locked={examState.locked}
                  onResult={async (data) => {
                    const baseXp = Number(challenge.points || 1000);
                    setExamState({
                      attemptNumber: data.attempt_number,
                      score: data.score_percentage,
                      earnedXp: resolveExamXpDisplay({
                        serverXp: data.earned_xp,
                        attemptNumber: data.attempt_number,
                        baseXp,
                      }),
                      locked: !isAdmin && (data.attempt_number || 0) >= 5
                    });

                    // Show congratulations if all tests passed (100%)
                    if (data.score_percentage === 100 && !badgeAwardedRef.current) {
                      badgeAwardedRef.current = true;
                      const badgeId = EXAM_BADGE_MAP[language];
                      const badgeInfo = BADGE_INFO[language];

                      // Award the badge
                      if (badgeId && !isAdmin) {
                        try {
                          await postAchievement({ achievementId: badgeId });
                          console.log(`🏆 Badge ${badgeId} awarded for ${language} exam!`);
                        } catch (err) {
                          console.error("Failed to award badge:", err);
                        }
                      }

                      setCongratsData({
                        xp: data.earned_xp,
                        xpAdded: data.xp_added,
                        badge: badgeInfo,
                        language,
                      });
                      setShowCongrats(true);
                    }
                  }}
                />
              ) : (
                <AuthLoadingOverlay />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Congratulations Modal */}
      {showCongrats && congratsData && (
        <div className={styles.congratsOverlay}>
          <div className={styles.congratsModal}>
            {/* Confetti particles */}
            <div className={styles.confettiContainer}>
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className={styles.confetti}
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                    backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b'][i % 6],
                    width: `${6 + Math.random() * 6}px`,
                    height: `${6 + Math.random() * 6}px`,
                  }}
                />
              ))}
            </div>

            <div className={styles.congratsIcon}>
              {congratsData?.badge?.image ? (
                <img
                  src={congratsData.badge.image}
                  alt={congratsData.badge.title || "Badge"}
                  style={{ width: "92px", height: "92px", objectFit: "contain" }}
                />
              ) : (
                <span>{congratsData?.badge?.icon || "🏆"}</span>
              )}
            </div>
            <h2 className={styles.congratsTitle}>Congratulations!</h2>
            <p className={styles.congratsSubtitle}>
              You passed the {congratsData.language?.toUpperCase()} Course
            </p>

            {/* Badge earned */}
            {congratsData.badge && (
              <div
                className={styles.congratsBadge}
                style={{ borderColor: congratsData.badge.color }}
              >
                {congratsData.badge.image ? (
                  <img
                    src={congratsData.badge.image}
                    alt={congratsData.badge.title}
                    className={styles.congratsBadgeImage}
                  />
                ) : (
                  <span className={styles.congratsBadgeIcon}>
                    {congratsData.badge.icon}
                  </span>
                )}
                <div>
                  <div
                    className={styles.congratsBadgeTitle}
                    style={{ color: congratsData.badge.color }}
                  >
                    {congratsData.badge.title}
                  </div>
                  <div className={styles.congratsBadgeDesc}>
                    {congratsData.badge.description}
                  </div>
                </div>
              </div>
            )}

            {/* XP earned */}
            <div className={styles.congratsXp}>
              <span className={styles.congratsXpIcon}>⚡</span>
              <span className={styles.congratsXpAmount}>+{congratsData.xp} XP</span>
              <span className={styles.congratsXpLabel}>earned</span>
            </div>

            <div className={styles.congratsActions}>
              <button
                className={styles.congratsBtnPrimary}
                onClick={() => navigate(`/learn/${language}`)}
              >
                Back to Course
              </button>
              <button
                className={styles.congratsBtnSecondary}
                onClick={() => setShowCongrats(false)}
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingExamPage;
