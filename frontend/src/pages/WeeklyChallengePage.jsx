import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "../styles/ExamPage.module.css";
import ExamCodeTerminal from "../components/ExamCodeTerminal";
import useWeeklyChallengeAttempt from "../services/useWeeklyChallengeAttempt";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios";
import MarkdownRenderer from "../components/MarkdownRenderer";

const DEFAULT_HOW_IT_WORKS = [
  "Your program is tested automatically using hidden test cases.",
  "Do NOT print extra text — only print the required output.",
  "Pass threshold is 70%.",
  "If you pass, you earn the challenge XP.",
];

function normalizeLanguage(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "js") return "javascript";
  if (v === "c++" || v === "cplusplus") return "cpp";
  if (v === "py") return "python";
  if (v === "python" || v === "cpp" || v === "javascript") return v;
  return "javascript";
}

const DEFAULT_HERO_BG =
  "https://res.cloudinary.com/daegpuoss/image/upload/v1773428260/tumblr_7e646d701b09619cbd7847b65ea580f0_b9bac3ad_1280_vqaegf.gif";

export default function WeeklyChallengePage() {
  const { taskId: taskIdParam } = useParams();
  const taskId = Number(taskIdParam);
  const navigate = useNavigate();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [task, setTask] = useState(() => location.state?.task || null);
  const [loadingTask, setLoadingTask] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [rewardModal, setRewardModal] = useState({
    open: false,
    xp: 0,
    prizeName: "",
    prizeType: "",
    prizeAssetUrl: "",
  });

  const { submit } = useWeeklyChallengeAttempt();

  const language = useMemo(() => normalizeLanguage(task?.language), [task]);
  const heroBackground = useMemo(() => {
    const cover = task?.cover_image || task?.coverImage || "";
    return String(cover || "").trim() || DEFAULT_HERO_BG;
  }, [task?.cover_image, task?.coverImage]);

  useEffect(() => {
    document.body.classList.add("exam-page");
    return () => {
      document.body.classList.remove("exam-page");
    };
  }, []);

  useEffect(() => {
    if (!Number.isFinite(taskId)) return;
    if (task && String(task.task_id || task.id || "") === String(taskId)) return;

    let cancelled = false;
    const load = async () => {
      setLoadingTask(true);
      setTaskError("");
      try {
        const res = await axiosPrivate.get(`/v1/weekly-tasks/task/${taskId}`);
        if (cancelled) return;
        if (res.data?.success) setTask(res.data.data);
        else setTaskError(res.data?.message || "Failed to load challenge");
      } catch (err) {
        if (cancelled) return;
        setTaskError(err?.response?.data?.message || err?.message || "Failed to load challenge");
      } finally {
        if (!cancelled) setLoadingTask(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    // If the user already completed this task (e.g. completed earlier), show the congrats modal once.
    const status = String(task?.userStatus || task?.user_status || "").toLowerCase();
    if (status !== "completed") return;
    if (!Number.isFinite(taskId)) return;
    if (rewardModal.open) return;

    const key = `weekly_complete_modal_shown:${taskId}`;
    try {
      if (localStorage.getItem(key) === "true") return;
    } catch {
      // ignore
    }

    const xp = Number(task?.xpAwarded || task?.xp_awarded || task?.reward_xp || 0);
    const prizeName = task?.reward_cosmetic?.name || "";
    const prizeType = task?.reward_cosmetic?.type || "";
    const prizeAssetUrl = task?.reward_cosmetic?.asset_url || "";
    if (xp <= 0 && !prizeName) return;

    setRewardModal({ open: true, xp, prizeName, prizeType, prizeAssetUrl });
    try {
      localStorage.setItem(key, "true");
    } catch {
      // ignore
    }
  }, [task, taskId, rewardModal.open]);

  const challenge = useMemo(() => {
    const title = task?.title || `Weekly Challenge #${Number.isFinite(taskId) ? taskId : ""}`;
    const description = task?.description || "";
    const starterCode = task?.starter_code || task?.starting_code || "";
    const testCases = Array.isArray(task?.test_cases) ? task.test_cases : [];
    const points = Number(task?.reward_xp || 0);

    return {
      id: task?.task_id ?? task?.id ?? taskId,
      title,
      points,
      starterCode,
      testCases,
      description,
    };
  }, [task, taskId]);

  const attemptId = useMemo(() => {
    const uid = user?.user_id || "anon";
    return `weekly_${uid}_${challenge.id || taskIdParam || ""}`;
  }, [user?.user_id, challenge.id, taskIdParam]);

  if (!Number.isFinite(taskId)) {
    return (
      <div className={styles.page}>
        <div className={styles.section}>
          <div className={styles.questionContainer}>
            <div className={styles.questionHeader}>
              <h2 className={styles.questionTitle}>Invalid Weekly Challenge</h2>
            </div>
            <div className={styles.questionText}>Bad task id.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section
        className={styles.hero}
        style={{
          backgroundImage: `url('${heroBackground}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 55%",
          height: "200px",
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Weekly Challenge</h1>
        </div>
      </section>

      <div className={styles.section}>
        <div className={styles.questionContainer}>
          <div className={styles.questionHeader}>
            <h2 className={styles.questionTitle}>{challenge.title}</h2>
            <span className={styles.questionPoints}>{earnedXp || challenge.points} XP</span>
          </div>

          {loadingTask ? (
            <div className={styles.questionText}>Loading challenge...</div>
          ) : taskError ? (
            <div className={styles.questionText}>{taskError}</div>
          ) : (
            <div className={styles.examLayout}>
              <div className={styles.examInfoColumn}>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    marginBottom: "1.2rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      background: "rgba(34,197,94,0.15)",
                      color: "#22c55e",
                      border: "1px solid #22c55e",
                    }}
                  >
                    Attempt 1 / ∞
                  </span>

                  {score > 0 ? (
                    <span
                      style={{
                        padding: "6px 14px",
                        borderRadius: "999px",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        background: "rgba(168,85,247,0.15)",
                        color: "#a855f7",
                        border: "1px solid #a855f7",
                      }}
                    >
                      Score: {score}%
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => navigate("/freedomwall/challenges")}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#e2e8f0",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Back to Community
                  </button>
                </div>

                <div
                  style={{
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.25)",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "0.6rem",
                      fontWeight: 700,
                      color: "#60a5fa",
                    }}
                  >
                    📘 How This Challenge Works
                  </h3>

                  <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.6", color: "#cbd5e1" }}>
                    {DEFAULT_HOW_IT_WORKS.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                    <li>
                      Reward: <strong>{challenge.points} XP</strong>.
                    </li>
                  </ul>
                </div>

                <div className={styles.questionText}>
                  <h3
                    style={{
                      marginTop: 0,
                      marginBottom: "0.75rem",
                      color: "#f1f5f9",
                      fontWeight: "700",
                    }}
                  >
                    Problem
                  </h3>
                  <div style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                    <MarkdownRenderer>{challenge.description || "(No description provided yet.)"}</MarkdownRenderer>
                  </div>
                </div>
              </div>

              <div className={styles.examCodeColumn}>
                <ExamCodeTerminal
                  language={language}
                  initialCode={challenge.starterCode}
                  testCases={challenge.testCases}
                  isMobileView={false}
                  mobilePanel="code"
                  attemptId={attemptId}
                  submitAttempt={async (code) => {
                    const result = await submit({ taskId, code });
                    if (!result) return null;
                    setScore(Number(result.score_percentage || 0));
                    setEarnedXp(Number(result.earned_xp || 0));

                    if (result?.passed) {
                      window.dispatchEvent(new Event("code-mania:notifications:refresh"));

                      const xp = Number(result?.xp_added || result?.earned_xp || 0);
                      const prize = result?.unlocked_cosmetic || null;
                      const prizeName = prize?.name || "";
                      const prizeType = prize?.type || "";
                      const prizeAssetUrl = prize?.asset_url || "";
                      if ((xp > 0 || prizeName) && !result?.already_completed) {
                        setRewardModal({ open: true, xp, prizeName, prizeType, prizeAssetUrl });
                      }
                    }
                    return result;
                  }}
                  attemptNumber={1}
                  isAdmin={isAdmin}
                  locked={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {rewardModal.open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Weekly rewards"
          className={styles.congratsOverlay}
          onClick={() => setRewardModal((p) => ({ ...p, open: false }))}
        >
          <div className={styles.congratsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.congratsIcon}>🏆</div>
            <div className={styles.congratsTitle}>Congratulations!</div>
            <div className={styles.congratsSubtitle}>You completed the Weekly Challenge.</div>

            {rewardModal.prizeName ? (
              <div className={styles.congratsBadge} style={{ borderColor: "rgba(251, 191, 36, 0.35)" }}>
                {rewardModal.prizeAssetUrl ? (
                  <img className={styles.congratsBadgeImage} src={rewardModal.prizeAssetUrl} alt="" />
                ) : (
                  <div className={styles.congratsBadgeIcon}>🎁</div>
                )}
                <div>
                  <div className={styles.congratsBadgeTitle}>{rewardModal.prizeName}</div>
                  <div className={styles.congratsBadgeDesc}>
                    {rewardModal.prizeType === "avatar_frame"
                      ? "Avatar frame unlocked"
                      : rewardModal.prizeType === "terminal_skin"
                        ? "Terminal theme unlocked"
                        : "Reward unlocked"}
                  </div>
                </div>
              </div>
            ) : null}

            {rewardModal.xp ? (
              <div className={styles.congratsXp}>
                <div className={styles.congratsXpIcon}>⚡</div>
                <div className={styles.congratsXpAmount}>{`+${rewardModal.xp}`}</div>
                <div className={styles.congratsXpLabel}>XP earned</div>
              </div>
            ) : null}

            <div className={styles.congratsActions}>
              <button
                type="button"
                className={styles.congratsBtnSecondary}
                onClick={() => setRewardModal((p) => ({ ...p, open: false }))}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.congratsBtnPrimary}
                onClick={() => {
                  setRewardModal((p) => ({ ...p, open: false }));
                  navigate("/profile");
                }}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
