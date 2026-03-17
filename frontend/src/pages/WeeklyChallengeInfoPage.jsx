import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Users, Pencil } from "lucide-react";
import { axiosPublic } from "../api/axios";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import useAuth from "../hooks/useAxios";
import useProfileSummary from "../services/useProfileSummary";
import styles from "../styles/PastChallengePage.module.css";
import AdminWeeklyTaskModal from "../components/AdminWeeklyTaskModal";
import MarkdownRenderer from "../components/MarkdownRenderer";

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
  const { isAuthenticated, user } = useAuth();
  const { totalXp } = useProfileSummary();
  const isAdmin = user?.role === "admin";

  const [tab, setTab] = useState("overview"); // overview | participated
  const [task, setTask] = useState(() => location.state?.task || null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");

  const cover = task?.cover_image || task?.coverImage || DEFAULT_COVER;
  const participatedCount = Number(task?.participants_count || participants.length || 0);
  const title = task?.title || "Weekly Challenge";
  const submitBy = task?.expires_at ? fmtDate(task.expires_at) : "-";
  const hasWeeklyAccess = Number(totalXp || 0) >= WEEKLY_XP_THRESHOLD;

  const requestSignIn = () => {
    navigate(location.pathname, {
      replace: true,
      state: { ...(location.state || {}), openSignIn: true },
    });
  };

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
        // Always refetch from API (avoid stale task data when editing).
        const http = isAuthenticated ? axiosPrivate : axiosPublic;
        const taskPromise = http.get(`/v1/weekly-tasks/task/${numericId}`);

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
  }, [numericId, isAuthenticated, reloadNonce]);

  const pageKicker = useMemo(() => {
    const difficulty = String(task?.difficulty || "").trim();
    return `Weekly Challenge / ${difficulty || "Current"}`;
  }, [task?.difficulty]);

  const handleAcceptAndCode = async () => {
    if (!Number.isFinite(numericId)) return;
    if (!isAuthenticated) {
      requestSignIn();
      return;
    }
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

  const canShowClaim = Boolean(import.meta.env.DEV) && Boolean(isAuthenticated) && Boolean(task?.reward_cosmetic);

  const handleClaim = async () => {
    if (!Number.isFinite(numericId)) return;
    if (!isAuthenticated) {
      requestSignIn();
      return;
    }

    setClaiming(true);
    setClaimMessage("");
    try {
      const res = await axiosPrivate.post(`/v1/weekly-tasks/${numericId}/claim`);
      if (res.data?.success) {
        const cosmeticName = res.data?.data?.cosmetic?.name || "reward";
        setClaimMessage(`Claimed: ${cosmeticName}`);
        setReloadNonce((n) => n + 1);
      } else {
        setClaimMessage(res.data?.message || "Failed to claim.");
      }
    } catch (err) {
      setClaimMessage(err?.response?.data?.message || err?.message || "Failed to claim.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.kicker}>{pageKicker}</div>

        <div className={styles.headerRow}>
          <h1 className={styles.title}>{title}</h1>
          <div style={{ display: "inline-flex", gap: "10px", alignItems: "center" }}>
            {isAdmin ? (
              <button type="button" className={styles.backBtn} onClick={() => setEditOpen(true)}>
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <Pencil size={16} />
                  Edit
                </span>
              </button>
            ) : null}
            <button type="button" className={styles.backBtn} onClick={() => navigate("/freedomwall/challenges")}>Back</button>
          </div>
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
                  <div className={styles.lede}>
                    <MarkdownRenderer>{task?.description || "(No description provided.)"}</MarkdownRenderer>
                  </div>
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
                  {!isAuthenticated
                    ? "Sign in to start"
                    : hasWeeklyAccess
                      ? "Ready to code?"
                      : `Locked until ${WEEKLY_XP_THRESHOLD.toLocaleString()} XP`}
                </div>
                <button
                  type="button"
                  className={styles.sideBtn}
                  disabled={accepting || (isAuthenticated && !hasWeeklyAccess)}
                  onClick={!isAuthenticated ? requestSignIn : hasWeeklyAccess ? handleAcceptAndCode : undefined}
                >
                  {!isAuthenticated
                    ? "Sign In"
                    : !hasWeeklyAccess
                      ? "Locked"
                      : accepting
                        ? "Accepting..."
                        : "Accept & Start"}
                </button>
              </div>

              {task?.reward_cosmetic ? (
                <div className={styles.sideCard}>
                  <div className={styles.sideCardTitle}>Prize</div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {task.reward_cosmetic.asset_url ? (
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.03)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: "0 0 auto",
                        }}
                      >
                        <img
                          src={task.reward_cosmetic.asset_url}
                          alt={task.reward_cosmetic.name || "Cosmetic"}
                          style={{ width: 44, height: 44, objectFit: "contain" }}
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900 }}>{task.reward_cosmetic.name || "Cosmetic"}</div>
                      <div style={{ color: "rgba(203, 213, 225, 0.9)", fontSize: "0.9rem" }}>
                        {task.reward_cosmetic.type === "avatar_frame" ? "Avatar frame" : "Terminal theme"}
                      </div>
                    </div>
                  </div>

                  {canShowClaim ? (
                    <div style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        className={styles.backBtn}
                        onClick={handleClaim}
                        disabled={claiming}
                        title="Dev-only: claim this prize to test cosmetics"
                        style={{ width: "100%" }}
                      >
                        {claiming ? "Claiming..." : "Claim"}
                      </button>
                      {claimMessage ? (
                        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>{claimMessage}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </div>

      {isAdmin ? (
        <AdminWeeklyTaskModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onTaskAdded={() => setReloadNonce((n) => n + 1)}
          initialTask={task}
        />
      ) : null}
    </div>
  );
}
