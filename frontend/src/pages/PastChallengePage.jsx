import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { axiosPublic } from "../api/axios";
import styles from "../styles/PastChallengePage.module.css";
import MarkdownRenderer from "../components/MarkdownRenderer";

const DEFAULT_COVER =
  "https://res.cloudinary.com/daegpuoss/image/upload/v1773428260/tumblr_7e646d701b09619cbd7847b65ea580f0_b9bac3ad_1280_vqaegf.gif";

function fmtDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function PastChallengePage() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const numericId = Number(taskId);
  const [tab, setTab] = useState("overview"); // overview | participated | winners
  const [task, setTask] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cover = task?.cover_image || task?.coverImage || DEFAULT_COVER;
  const participatedCount = Number(task?.participants_count || 0);

  const winners = useMemo(() => {
    const announced = Array.isArray(task?.winners) ? task.winners : [];
    if (announced.length) return announced;

    const completed = (Array.isArray(participants) ? participants : [])
      .filter((p) => String(p?.status || "").toLowerCase() === "completed")
      .sort((a, b) => {
        const xpA = Number(a?.xp_awarded || 0);
        const xpB = Number(b?.xp_awarded || 0);
        if (xpB !== xpA) return xpB - xpA;

        const doneA = a?.completed_at ? new Date(a.completed_at).getTime() : Number.POSITIVE_INFINITY;
        const doneB = b?.completed_at ? new Date(b.completed_at).getTime() : Number.POSITIVE_INFINITY;
        return doneA - doneB;
      });

    return completed.map((p, index) => ({
      user_id: p.user_id,
      username: p.username,
      character_id: p.character_id,
      rank: index + 1,
      note: "Completed challenge",
    }));
  }, [participants, task?.winners]);

  const title = task?.title || "Past Challenge";
  const endedAt = task?.expires_at ? fmtDate(task.expires_at) : "-";

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
        const [taskRes, partRes] = await Promise.all([
          axiosPublic.get(`/v1/weekly-tasks/past/${numericId}`),
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
    return `Weekly Challenge / ${difficulty || "Past"}`;
  }, [task?.difficulty]);

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.kicker}>{pageKicker}</div>

        <div className={styles.headerRow}>
          <h1 className={styles.title}>{title}</h1>
          <button type="button" className={styles.backBtn} onClick={() => navigate("/freedomwall/challenges")}>Back</button>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Past challenge tabs">
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
          <button
            type="button"
            className={`${styles.tab} ${tab === "winners" ? styles.tabActive : ""}`}
            onClick={() => setTab("winners")}
            aria-selected={tab === "winners"}
          >
            Winners
            <span className={styles.countPill}>{winners.length}</span>
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

              {tab === "winners" ? (
                <div className={styles.listCard}>
                  <div className={styles.listTitle}>Winners</div>
                  {winners.length ? (
                    <div className={styles.winnersList}>
                      {winners.map((w) => (
                        <div key={w.user_id} className={styles.winnerRow}>
                          <div className={styles.rank}>#{w.rank || "-"}</div>
                          <div className={styles.winnerUser}>@{w.username || "unknown"}</div>
                          <div className={styles.note}>{w.note || ""}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>No completed submissions yet.</div>
                  )}
                </div>
              ) : null}
            </div>

            <aside className={styles.side}>
              <div className={styles.statCard}>
                <div className={styles.statTitle}>Challenge Info</div>
                <div className={styles.statRow}>
                  <CalendarDays size={16} />
                  <span>Ended {endedAt}</span>
                </div>
                <div className={styles.statRow}>
                  <Users size={16} />
                  <span>Total participated: {participatedCount}</span>
                </div>
                <div className={styles.statRow}>
                  <Trophy size={16} />
                  <span>Winners: {winners.length}</span>
                </div>
              </div>

              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>
                  {winners.length ? "Winners have been announced!" : "Completed submissions"}
                </div>
                <button type="button" className={styles.sideBtn} onClick={() => setTab("winners")}>
                  {winners.length ? "View winners" : "View completed"}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
