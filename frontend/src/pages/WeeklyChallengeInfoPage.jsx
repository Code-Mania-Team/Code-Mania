import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Users } from "lucide-react";
import { axiosPublic } from "../api/axios";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useProfileSummary from "../services/useProfileSummary";
import styles from "../styles/PastChallengePage.module.css";

const DEFAULT_COVER =
  "https://res.cloudinary.com/daegpuoss/image/upload/v1773428260/tumblr_7e646d701b09619cbd7847b65ea580f0_b9bac3ad_1280_vqaegf.gif";

const WEEKLY_XP_THRESHOLD = 5000;

function fmtDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function WeeklyChallengeInfoPage() {
  const { taskId } = useParams();
  const numericId = Number(taskId);
  const navigate = useNavigate();
  const location = useLocation();
  const axiosPrivate = useAxiosPrivate();
  const { totalXp } = useProfileSummary();

  const [tab, setTab] = useState("overview"); // overview | participated
  const [task, setTask] = useState(() => location.state?.task || null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  const cover = task?.cover_image || task?.coverImage || DEFAULT_COVER;
  const participatedCount = Number(task?.participants_count || participants.length || 0);
  const title = task?.title || "Weekly Challenge";
  const submitBy = task?.expires_at ? fmtDate(task.expires_at) : "-";
  const hasWeeklyAccess = Number(totalXp || 0) >= WEEKLY_XP_THRESHOLD;

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setError("Invalid challenge id.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const taskPromise = task && String(task?.task_id || task?.id || "") === String(numericId)
          ? Promise.resolve({ data: { success: true, data: task } })
          : axiosPrivate.get(`/v1/weekly-tasks/task/${numericId}`);

        const [taskRes, partRes] = await Promise.all([
          taskPromise,
          axiosPublic.get(`/v1/weekly-tasks/${numericId}/participants`, { params: { limit: 500 } }),
        ]);

        if (cancelled) return;

        if (!taskRes.data?.success) {
          setError(taskRes.data?.message || "Failed to load challenge");
          setTask(null);
          setParticipants([]);
          return;
        }

        setTask(taskRes.data.data);

        const rows = partRes.data?.success ? (partRes.data?.data || []) : [];
        setParticipants(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || "Failed to load challenge");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [numericId]);

  const pageKicker = useMemo(() => {
    const difficulty = String(task?.difficulty || "").trim();
    return `Weekly Challenge / ${difficulty || "Current"}`;
  }, [task?.difficulty]);

  const handleAcceptAndCode = async () => {
    if (!Number.isFinite(numericId)) return;
    if (!hasWeeklyAccess) return;

    setAccepting(true);
    try {
      await axiosPrivate.post(`/v1/weekly-tasks/${numericId}/accept`);
    } catch {
      // Accept is best-effort; user can still code if the task payload was provided.
    } finally {
      setAccepting(false);
    }

    navigate(`/weekly-challenge/${encodeURIComponent(String(numericId))}`, {
      state: { task },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.kicker}>{pageKicker}</div>

        <div className={styles.headerRow}>
          <h1 className={styles.title}>{title}</h1>
          <button type="button" className={styles.backBtn} onClick={() => navigate("/freedomwall/challenges")}>Back</button>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Weekly challenge tabs">
          <button
            type="button"
            className={`${styles.tab} ${tab === "overview" ? styles.tabActive : ""}`}
            onClick={() => setTab("overview")}
            aria-selected={tab === "overview"}
          >
            Overview
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === "participated" ? styles.tabActive : ""}`}
            onClick={() => setTab("participated")}
            aria-selected={tab === "participated"}
          >
            Participated
            <span className={styles.countPill}>{participatedCount}</span>
          </button>
        </div>

        <div className={styles.rule} />

        {loading ? (
          <div className={styles.state}>Loading...</div>
        ) : error ? (
          <div className={styles.state}>{error}</div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.main}>
              <div className={styles.coverCard}>
                <img className={styles.coverImg} src={cover} alt="" />
              </div>

              {tab === "overview" ? (
                <div className={styles.copy}>
                  <p className={styles.lede}>{task?.description || "(No description provided.)"}</p>
                </div>
              ) : null}

              {tab === "participated" ? (
                <div className={styles.listCard}>
                  <div className={styles.listTitle}>Participated</div>
                  <div className={styles.pills}>
                    {participants.map((p) => (
                      <NavLink
                        key={p.user_id}
                        className={styles.userPill}
                        to={p?.username ? `/profile/${encodeURIComponent(p.username)}` : "/profile"}
                      >
                        @{p.username || "unknown"}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className={styles.side}>
              <div className={styles.statCard}>
                <div className={styles.statTitle}>Challenge Info</div>
                <div className={styles.statRow}>
                  <CalendarDays size={16} />
                  <span>Submit by {submitBy}</span>
                </div>
                <div className={styles.statRow}>
                  <Users size={16} />
                  <span>Total participated: {participatedCount}</span>
                </div>
              </div>

              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>
                  {hasWeeklyAccess ? "Ready to code?" : `Locked until ${WEEKLY_XP_THRESHOLD.toLocaleString()} XP`}
                </div>
                <button
                  type="button"
                  className={styles.sideBtn}
                  disabled={!hasWeeklyAccess || accepting}
                  onClick={handleAcceptAndCode}
                >
                  {accepting ? "Accepting..." : "Accept & Start"}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
