import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BadgeCheck, Search, Send, Clock, Star, Zap, Trophy, ChevronRight, CheckCircle2, Lock, Home, Hash } from "lucide-react";
import { containsProfanity } from "../utils/profanityFilter";
import "../styles/FreedomWall.css";

import useGetAllPosts from "../services/home";
import useUserPost from "../services/postFreedomwall";
import useAuth from "../hooks/useAxios";
import useWeeklyTasks from "../services/useWeeklyTasks";
import useProfileSummary from "../services/useProfileSummary";
import AdminWeeklyTaskModal from "../components/AdminWeeklyTaskModal";
import usePastChallenges from "../services/usePastChallenges";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { axiosPublic } from "../api/axios";

// Character icons from Cloudinary
const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';
const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';
const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';
const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';

const ADMIN_USERS = new Set(["codemania"]);
const WEEKLY_XP_THRESHOLD = 5000;

// Difficulty badge colors
const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",   color: "#34d399", bg: "rgba(52, 211, 153, 0.12)" },
  medium: { label: "Medium", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.12)" },
  hard:   { label: "Hard",   color: "#f87171", bg: "rgba(248, 113, 113, 0.12)" },
};

const COMMUNITY_CHANNELS = [
  { id: "general", label: "General" },
  { id: "introductions", label: "Introductions" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "cpp", label: "C++" },
  { id: "memes", label: "Memes" },
  { id: "bug-reports", label: "Bug Reports" },
];

// Mock weekly tasks for demo (used when API returns empty or errors)
const MOCK_WEEKLY_TASKS = [
  {
    task_id: 1,
    title: "Debug the Loop",
    description: "Find and fix the bug in the provided Python while-loop snippet.",
    reward_xp: 200,
    difficulty: "easy",
    min_xp_required: 5000,
    userStatus: "not_started",
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    task_id: 2,
    title: "Refactor Challenge",
    description: "Refactor the given JavaScript function to use async/await instead of callbacks.",
    reward_xp: 350,
    difficulty: "medium",
    min_xp_required: 5000,
    userStatus: "not_started",
    expires_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    task_id: 3,
    title: "Algorithm Sprint",
    description: "Implement a binary search algorithm in C++ from scratch.",
    reward_xp: 500,
    difficulty: "hard",
    min_xp_required: 5000,
    userStatus: "in_progress",
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock past challenges for UI preview (used if API returns none)
const MOCK_PAST_CHALLENGES = [
  {
    task_id: 9001,
    title: "Array Flip Frenzy",
    description: "Write a function that reverses an array. Keep it clean: no extra prints.",
    difficulty: "easy",
    language: "javascript",
    reward_xp: 250,
    expires_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    participants_count: 12,
    winners: [
      { user_id: 101, rank: 1, note: "Fast + clean output", username: "vader", character_id: 1 },
      { user_id: 102, rank: 2, note: "Great edge cases", username: "philo", character_id: 2 },
      { user_id: 103, rank: 3, note: "Nice explanation", username: "coders", character_id: 0 },
    ],
    mock_participants: [
      { user_id: 101, username: "vader", status: "completed" },
      { user_id: 102, username: "philo", status: "completed" },
      { user_id: 103, username: "coders", status: "completed" },
      { user_id: 104, username: "alice", status: "in_progress" },
      { user_id: 105, username: "bob", status: "in_progress" },
    ],
  },
];

const FreedomWall = ({ onOpenModal, view = "home", channelId }) => {
  const navigate = useNavigate();
  const getAllPosts = useGetAllPosts();
  const COOLDOWN_MINUTES = 30;
  const userPost = useUserPost();
  const { isAuthenticated, user } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const { totalXp } = useProfileSummary();
  const { tasks: apiTasks, loading: tasksLoading, acceptTask } = useWeeklyTasks();
  const { past: pastChallenges, loading: pastLoading, error: pastError, refetch: refetchPast } = usePastChallenges({ limit: 25 });
  const [comments, setComments] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const [newComment, setNewComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [challengeActionMsg, setChallengeActionMsg] = useState("");
  const [participantsByTaskId, setParticipantsByTaskId] = useState({});
  const [participantsLoadingByTaskId, setParticipantsLoadingByTaskId] = useState({});

  const getTaskId = (task) => {
    const raw = task?.task_id ?? task?.id ?? task?.taskId;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  // Weekly tasks - use API tasks, fallback to mock
  const usingMockTasks = apiTasks.length === 0;
  const weeklyTasks = !usingMockTasks ? apiTasks : MOCK_WEEKLY_TASKS;
  const hasWeeklyAccess = totalXp >= WEEKLY_XP_THRESHOLD;

  const safePastChallenges = Array.isArray(pastChallenges) ? pastChallenges : [];
  const effectivePastChallenges =
    (!pastLoading && !pastError && safePastChallenges.length === 0)
      ? MOCK_PAST_CHALLENGES
      : safePastChallenges;

  const ensureParticipantsLoaded = async (task) => {
    const taskId = getTaskId(task);
    if (!taskId) return;
    if (participantsByTaskId[taskId]) return;
    if (participantsLoadingByTaskId[taskId]) return;

    if (Array.isArray(task?.mock_participants)) {
      setParticipantsByTaskId((prev) => ({ ...prev, [taskId]: task.mock_participants }));
      return;
    }

    setParticipantsLoadingByTaskId((prev) => ({ ...prev, [taskId]: true }));
    try {
      const res = await axiosPublic.get(`/v1/weekly-tasks/${taskId}/participants`, { params: { limit: 200 } });
      const rows = res.data?.success ? (res.data?.data || []) : [];
      setParticipantsByTaskId((prev) => ({ ...prev, [taskId]: Array.isArray(rows) ? rows : [] }));
    } catch {
      setParticipantsByTaskId((prev) => ({ ...prev, [taskId]: [] }));
    } finally {
      setParticipantsLoadingByTaskId((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const cooldownKey = useMemo(() => {
    if (!user?.user_id) return null;
    return `freedomwallLastPost_${user.user_id}`;
  }, [user?.user_id]);

  const isAdminPoster =
    user?.role === 'admin' ||
    ADMIN_USERS.has(String(user?.username || '').trim().toLowerCase());

  const iconByCharacterId = useMemo(() => {
    return {
      0: characterIcon1,
      1: characterIcon0,
      2: characterIcon2,
      3: characterIcon3,
    };
  }, []);

  const formatTimeAgo = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (!date || Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec} sec ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} mins ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return '1 hr ago';
    if (diffHr < 24) return `${diffHr} hrs ago`;

    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return '1 day ago';
    if (diffDay < 7) return `${diffDay} days ago`;

    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek === 1) return '1 week ago';
    return `${diffWeek} weeks ago`;
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return '';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const mapApiPostToComment = (post) => {
    const rawUsername = post?.users?.username ?? post?.username;
    const username = rawUsername ? String(rawUsername) : 'Anonymous';
    const characterIdRaw = post?.users?.character_id ?? post?.character_id;
    const characterId = characterIdRaw === null || characterIdRaw === undefined ? null : Number(characterIdRaw);
    const avatar = characterId !== null && !Number.isNaN(characterId) ? (iconByCharacterId[characterId] || null) : null;

    const createdAtLabel = post?.created_at ? formatTimeAgo(post.created_at) : '';

    return {
      id: post?.fd_wall_id ?? post?.id ?? Date.now(),
      user: username,
      username,
      avatar,
      text: post?.content ?? '',
      time: createdAtLabel,
      isAdmin: ADMIN_USERS.has(username.trim().toLowerCase()),
    };
  };

  const fetchPosts = async () => {
    setIsFetching(true);
    setFetchError('');
    try {
      const res = await getAllPosts();
      const items = Array.isArray(res?.result) ? res.result : [];
      setComments(items.map(mapApiPostToComment));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch posts.';
      setFetchError(String(msg));
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddComment = async () => {
    const content = (newComment || '').trim();

    if (!isAuthenticated || !user?.user_id) {
      setPostError("Please sign in to post in the Community.");
      if (typeof onOpenModal === "function") {
        onOpenModal();
      }
      return;
    }

    if (!content) return;

    if (containsProfanity(content)) {
      setPostError("Your post contains inappropriate language.");
      return;
    }

    if (!isAdminPoster) {
      const lastPostTimeRaw = cooldownKey ? localStorage.getItem(cooldownKey) : null;

      if (lastPostTimeRaw) {
        const lastPostTime = parseInt(lastPostTimeRaw, 10);

        if (!isNaN(lastPostTime)) {
          const now = Date.now();
          const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
          const timePassed = now - lastPostTime;

          if (timePassed < cooldownMs) {
            const remainingMs = cooldownMs - timePassed;
            const remainingMinutes = Math.ceil(remainingMs / 60000);

            setPostError(
              `You can post again in ${remainingMinutes} minute(s).`
            );
            return;
          }
        }
      }
    }

    setIsPosting(true);
    setPostError('');

    try {
      const res = await userPost(content);

      if (res?.success) {
        if (cooldownKey && !isAdminPoster) {
          localStorage.setItem(cooldownKey, String(Date.now()));
        }

        const created = res?.data ? mapApiPostToComment(res.data) : null;

        if (created) {
          setComments((prev) => [created, ...prev]);
        } else {
          await fetchPosts();
        }

        setNewComment('');
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setPostError('Please sign in to post in the Community.');
        if (typeof onOpenModal === 'function') {
          onOpenModal();
        }
        return;
      }

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create post.';

      setPostError(String(msg));
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleAcceptTask = async (task_id) => {
    try {
      await acceptTask(task_id);
    } catch {
      // error handled in hook
    }
  };

  const handleStartWeeklyChallenge = async (task) => {
    const taskId = getTaskId(task);
    if (!isAuthenticated || !user?.user_id) {
      setChallengeActionMsg("Sign in to accept the Weekly Challenge.");
      if (typeof onOpenModal === "function") onOpenModal();
      return;
    }

    if (!taskId) {
      setChallengeActionMsg("Missing challenge id. Please refresh and try again.");
      return;
    }

    if (usingMockTasks) {
      setChallengeActionMsg(
        "No weekly challenges found in the database yet. Create one in admin first (this is a preview card)."
      );
      navigate(`/weekly-challenge/${encodeURIComponent(String(taskId))}`, {
        state: { task },
      });
      return;
    }

    if (!hasWeeklyAccess) {
      setChallengeActionMsg(
        `Weekly Challenge is locked until ${WEEKLY_XP_THRESHOLD.toLocaleString()} XP.`
      );
      return;
    }

    await handleAcceptTask(taskId);
    navigate(`/weekly-challenge/${encodeURIComponent(String(taskId))}`, {
      state: { task },
    });
  };

  const handlePickWinners = async (task) => {
    const taskId = getTaskId(task);
    if (!taskId) return;

    const raw = window.prompt(
      "Enter winners usernames (comma-separated), in order. Example: vader, philo, alice"
    );
    if (!raw) return;

    const usernames = raw
      .split(",")
      .map((s) => s.trim().replace(/^@+/, ""))
      .filter(Boolean);
    if (!usernames.length) return;

    try {
      await axiosPrivate.post(`/v1/weekly-tasks/${taskId}/winners`, {
        winners: usernames.map((username, idx) => ({ username, rank: idx + 1 })),
      });
      await refetchPast();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to set winners";
      window.alert(String(msg));
    }
  };

  const filteredComments = comments.filter(comment =>
    comment.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="community-shell">
    <div className={`community-page ${view === "challenges" ? "has-right" : "no-right"}`}>
      {/* ═══ Left Sidebar — Navigation ═══ */}
      <aside className="community-nav">
        <div className="community-nav-card">
          <div className="community-nav-section">
            <div className="community-nav-item-group">
              <NavLink
                to="/freedomwall"
                end
                className={({ isActive }) => `community-nav-item ${isActive ? "is-active" : ""}`}
              >
                <Home size={18} />
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/freedomwall/challenges"
                className={({ isActive }) => `community-nav-item ${isActive ? "is-active" : ""}`}
              >
                <Hash size={18} />
                <span>Weekly Challenge</span>
              </NavLink>
            </div>
          </div>

          <div className="community-nav-divider" />

          <div className="community-nav-section">
            <div className="community-nav-section-title">Channels</div>
            <div className="community-nav-item-group">
              {COMMUNITY_CHANNELS.map((ch) => (
                <NavLink
                  key={ch.id}
                  to={`/freedomwall/channel/${encodeURIComponent(ch.id)}`}
                  className={({ isActive }) => `community-nav-channel ${isActive ? "is-active" : ""}`}
                >
                  <span className="channel-hash">#</span>
                  <span>{ch.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <main className={`community-main ${view === "challenges" ? "challenges-main" : "posts-main"}`}>
        {view === "challenges" ? (
          <>
            <div className="challenges-hero">
            <div className="challenges-hero-badge">
              <Hash size={18} />
              Weekly Challenge
            </div>
            <h1 className="challenges-hero-title">Weekly Challenge</h1>
            <p className="challenges-hero-subtitle">Solve a weekly task, earn XP, and collect rewards.</p>
          </div>

            <div className="challenges-panel">
              <div className="challenges-panel-header">
                <div className="challenges-panel-title">Current and upcoming</div>
                {isAdminPoster ? (
                  <button
                    className="admin-add-task-btn"
                    onClick={() => setIsTaskModalOpen(true)}
                    type="button"
                  >
                    + Add Task
                  </button>
                ) : null}
              </div>

              {challengeActionMsg ? (
                <div className="challenges-banner" role="status">
                  {challengeActionMsg}
                </div>
              ) : null}

              {!isAuthenticated ? (
                <div className="sidebar-locked-card">
                  <Lock size={28} className="sidebar-locked-icon" />
                  <p className="sidebar-locked-text">Sign in to view weekly challenges</p>
                  <button className="sidebar-unlock-btn" onClick={onOpenModal}>
                    Sign In
                  </button>
                </div>
              ) : tasksLoading ? (
                <div className="sidebar-loading">Loading challenges...</div>
              ) : (
                <>
                  {!hasWeeklyAccess ? (
                    <div className="sidebar-xp-progress challenges-xp-inline">
                      <div className="sidebar-xp-bar">
                        <div
                          className="sidebar-xp-fill"
                          style={{ width: `${Math.min(100, (totalXp / WEEKLY_XP_THRESHOLD) * 100)}%` }}
                        />
                      </div>
                      <span className="sidebar-xp-label">
                        {totalXp?.toLocaleString() || 0} / {WEEKLY_XP_THRESHOLD.toLocaleString()} XP (unlock)
                      </span>
                    </div>
                  ) : null}

                  <div className="sidebar-tasks-list challenges-tasks-list">
                    {weeklyTasks.map((task) => {
                      const diff = DIFFICULTY_CONFIG[task.difficulty] || DIFFICULTY_CONFIG.medium;
                      const isCompleted = task.userStatus === 'completed';
                      const isInProgress = task.userStatus === 'in_progress';
                      const taskId = getTaskId(task) ?? task.task_id ?? task.id;

                      return (
                        <div
                          key={taskId}
                          className={`task-card ${isCompleted ? 'task-card-completed' : ''} ${isInProgress ? 'task-card-active' : ''}`}
                        >
                          <div className="task-card-header">
                            <span
                              className="task-difficulty-badge"
                              style={{ color: diff.color, background: diff.bg }}
                            >
                              {diff.label}
                            </span>
                            <span className="task-time-remaining">
                              <Clock size={12} />
                              {getTimeRemaining(task.expires_at)}
                            </span>
                          </div>

                          <h3 className="task-title">{task.title}</h3>
                          <p className="task-description">{task.description}</p>

                          <div className="task-footer">
                            <div className="task-reward">
                              <Zap size={14} className="task-reward-icon" />
                              <span>+{task.reward_xp} XP</span>
                            </div>

                            {isCompleted ? (
                              <button
                                className="task-accept-btn"
                                onClick={() => handleStartWeeklyChallenge(task)}
                                type="button"
                              >
                                View
                                <ChevronRight size={14} />
                              </button>
                            ) : isInProgress ? (
                              <button
                                className="task-accept-btn"
                                onClick={() => handleStartWeeklyChallenge(task)}
                                type="button"
                              >
                                Continue
                                <ChevronRight size={14} />
                              </button>
                            ) : (
                              <button
                                className="task-accept-btn"
                                onClick={() => handleStartWeeklyChallenge(task)}
                                type="button"
                              >
                                Accept
                                <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="challenges-panel past-panel">
              <div className="challenges-panel-header">
                <div className="challenges-panel-title">Past challenges</div>
              </div>

              {pastLoading ? (
                <div className="sidebar-loading">Loading past challenges...</div>
              ) : pastError ? (
                <div className="challenges-banner" role="status">{pastError}</div>
              ) : effectivePastChallenges.length === 0 ? (
                <div className="sidebar-loading">No past challenges yet.</div>
              ) : (
                <div className="past-challenges-list">
                  {(effectivePastChallenges || []).map((t) => {
                    const diff = DIFFICULTY_CONFIG[t.difficulty] || DIFFICULTY_CONFIG.medium;
                    const winners = Array.isArray(t.winners) ? t.winners : [];
                    const ended = t.expires_at ? new Date(t.expires_at) : null;

                    return (
                      <details
                        key={`past-${t.task_id}`}
                        className="past-card"
                        onToggle={(e) => {
                          if (e.currentTarget.open) {
                            ensureParticipantsLoaded(t);
                          }
                        }}
                      >
                        <summary className="past-summary">
                          <div className="past-summary-left">
                            <span className="task-difficulty-badge" style={{ color: diff.color, background: diff.bg }}>
                              {diff.label}
                            </span>
                            <div className="past-title-wrap">
                              <div className="past-title">{t.title}</div>
                              <div className="past-meta">
                                {ended ? `Ended ${ended.toLocaleDateString()}` : "Ended"} • {Number(t.participants_count || 0)} participated
                              </div>
                            </div>
                          </div>

                          <div className="past-summary-right">
                            {winners.length ? (
                              <div className="past-winners">
                                <span className="past-winners-label">Winners</span>
                                <div className="past-winners-avatars">
                                  {winners.slice(0, 3).map((w) => (
                                    <span key={`${t.task_id}-w-${w.user_id}`} className="past-winner-avatar" title={w.username || "Winner"}>
                                      {(w.username || "?").slice(0, 1).toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="past-winners-label">No winners yet</span>
                            )}
                          </div>
                        </summary>

                        <div className="past-details">
                          <div className="past-desc">{t.description}</div>

                          <div className="past-winner-list">
                            <div className="past-section-title">Participated</div>
                            {participantsLoadingByTaskId[t.task_id] ? (
                              <div className="past-meta">Loading participants...</div>
                            ) : (
                              <div className="past-participants">
                                {(participantsByTaskId[t.task_id] || []).slice(0, 50).map((p) => (
                                  <button
                                    key={`${t.task_id}-p-${p.user_id}`}
                                    type="button"
                                    className="past-participant"
                                    onClick={() => p?.username && navigate(`/profile/${encodeURIComponent(p.username)}`)}
                                    title={p?.status ? `${p.status}` : ""}
                                  >
                                    @{p.username || "unknown"}
                                  </button>
                                ))}

                                {(participantsByTaskId[t.task_id] || []).length > 50 ? (
                                  <div className="past-meta">
                                    Showing 50 of {(participantsByTaskId[t.task_id] || []).length}.
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>

                          {winners.length ? (
                            <div className="past-winner-list">
                              <div className="past-section-title">Winners</div>
                              {winners.map((w) => (
                                <div key={`${t.task_id}-wl-${w.user_id}`} className="past-row">
                                  <span className="past-rank">#{w.rank || "-"}</span>
                                  <span className="past-user">@{w.username || "unknown"}</span>
                                  <span className="past-note">{w.note || ""}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {isAdminPoster ? (
                            <button type="button" className="past-admin-btn" onClick={() => handlePickWinners(t)}>
                              Pick winners
                            </button>
                          ) : null}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {view === "channel" ? (
              <div className="challenges-hero" style={{ paddingTop: 0 }}>
                <div className="challenges-hero-badge">
                  <Hash size={18} />
                  #{COMMUNITY_CHANNELS.find((c) => c.id === String(channelId || ""))?.label || channelId || "channel"}
                </div>
              </div>
            ) : null}
            {/* Search Bar */}
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder={view === "channel" ? "Search channel posts..." : "Search posts..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Comment Input */}
            <div className="comment-input-section">
              <div className="comment-input-wrapper">
                <img
                  src={localStorage.getItem('selectedCharacterIcon') || "https://api.dicebear.com/7.x/pixel-art/svg?seed=you"}
                  alt="Your avatar"
                  className="avatar"
                />
                <div className="comment-input">
                  <textarea
                    placeholder={
                      isAuthenticated
                        ? "Share your thoughts with the community..."
                        : "Sign in to post in the Community"
                    }
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      setPostError('');
                    }}
                    onKeyPress={handleKeyPress}
                    disabled={!isAuthenticated || isPosting}
                  />
                  <button
                    onClick={handleAddComment}
                    className="post-button"
                    disabled={isPosting}
                  >
                    <Send className="send-icon" />
                    {isPosting ? 'Posting...' : isAuthenticated ? 'Post' : 'Sign in'}
                  </button>
                </div>
              </div>
              {postError ? (
                <div className="no-results">{postError}</div>
              ) : null}
            </div>

            {/* Comments List */}
            <div className="comments-section">
              {isFetching ? (
                <div className="no-results">Loading posts...</div>
              ) : fetchError ? (
                <div className="no-results">{fetchError}</div>
              ) : filteredComments.length > 0 ? (
                filteredComments.map((comment) => (
                  <div key={comment.id} className="comment-card">
                    {comment.username && comment.username !== 'Anonymous' && !comment.isAdmin ? (
                      <button
                        type="button"
                        className="comment-avatar-btn"
                        onClick={() => navigate(`/profile/${encodeURIComponent(comment.username)}`)}
                        aria-label={`View ${comment.username}'s profile`}
                      >
                        <img
                          src={comment.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(comment.user)}`}
                          alt={`${comment.user}'s avatar`}
                          className="comment-avatar"
                        />
                      </button>
                    ) : (
                      <img
                        src={comment.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(comment.user)}`}
                        alt={`${comment.user}'s avatar`}
                        className="comment-avatar"
                      />
                    )}
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-user-wrap">
                          {comment.username && comment.username !== 'Anonymous' && !comment.isAdmin ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/profile/${encodeURIComponent(comment.username)}`)}
                              className={`comment-user comment-user-btn ${comment.isAdmin ? 'comment-user-admin' : ''}`}
                              aria-label={`View ${comment.username}'s profile`}
                            >
                              {comment.user}
                            </button>
                          ) : (
                            <span className={`comment-user ${comment.isAdmin ? 'comment-user-admin' : ''}`}>{comment.user}</span>
                          )}
                          {comment.isAdmin ? <BadgeCheck className="verified-badge" aria-label="Verified admin" /> : null}
                        </span>
                        <span className="comment-time">{comment.time}</span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  No comments found. Be the first to share your thoughts!
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Weekly challenges now live in the Challenges view (main column) */}

      {/* Admin Add Task Modal */}
      {isAdminPoster && (
        <AdminWeeklyTaskModal 
          isOpen={isTaskModalOpen} 
          onClose={() => setIsTaskModalOpen(false)} 
          onTaskAdded={() => {
            // Refetch or update UI when a task is added (can trigger window reload or specific refetch here)
            window.location.reload(); 
          }}
        />
      )}
    </div>
    </div>
  );
};

export default FreedomWall;
