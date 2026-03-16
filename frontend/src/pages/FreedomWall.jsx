import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BadgeCheck, Search, Send, Clock, Star, Zap, Trophy, ChevronRight, CheckCircle2, Lock, Home, Hash, CalendarDays, Users, Heart } from "lucide-react";
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

const LANGUAGE_CONFIG = {
  javascript: { label: "JavaScript", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.12)" },
  python: { label: "Python", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
  cpp: { label: "C++", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.12)" },
};

const getLanguageMeta = (task) => {
  const slug = String(task?.language || task?.programming_language?.slug || "").trim().toLowerCase();
  return LANGUAGE_CONFIG[slug] || (slug ? { label: slug, color: "#e2e8f0", bg: "rgba(226, 232, 240, 0.08)" } : null);
};

const stripLeadingHash = (raw) => {
  const s = String(raw || "").trim();
  if (!s) return "";
  return s.startsWith("#") ? s.slice(1) : s;
};

const ensureLeadingHash = (raw) => {
  const s = String(raw || "").trim();
  if (!s) return "";
  return s.startsWith("#") ? s : `#${s}`;
};

const DEFAULT_CHALLENGE_COVER =
  "https://res.cloudinary.com/daegpuoss/image/upload/v1773428260/tumblr_7e646d701b09619cbd7847b65ea580f0_b9bac3ad_1280_vqaegf.gif";

const ENABLE_MOCK_CHALLENGES = String(import.meta.env.VITE_ENABLE_MOCK_CHALLENGES || "").toLowerCase() === "true";

// Mock tasks can be enabled locally via VITE_ENABLE_MOCK_CHALLENGES=true
const MOCK_WEEKLY_TASKS = ENABLE_MOCK_CHALLENGES
  ? [
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
    ]
  : [];

const MOCK_PAST_CHALLENGES = ENABLE_MOCK_CHALLENGES
  ? [
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
    ]
  : [];

const FreedomWall = ({ onOpenModal, view = "home", tag }) => {
  const navigate = useNavigate();
  const getAllPosts = useGetAllPosts();
  const COOLDOWN_MINUTES = 1;
  const userPost = useUserPost();
  const { isAuthenticated, user } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const { totalXp } = useProfileSummary();
  const { tasks: apiTasks, loading: tasksLoading, error: tasksError, acceptTask } = useWeeklyTasks();
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
  const [heartsByPostId, setHeartsByPostId] = useState({});
  const lastHeartsFetchKeyRef = React.useRef("");
  const [topHashtags, setTopHashtags] = useState([]);
  const [topHashtagsLoading, setTopHashtagsLoading] = useState(false);

  const fetchHeartStats = async (postIds) => {
    const ids = (postIds || [])
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n) && n > 0)
      .slice(0, 200);
    if (!ids.length) return;

    const key = ids.join(",");
    if (!key || key === lastHeartsFetchKeyRef.current) return;
    lastHeartsFetchKeyRef.current = key;

    try {
      const http = isAuthenticated ? axiosPrivate : axiosPublic;
      const stats = await http.get(`/v1/post/batch`, {
        params: { ids: key },
      });
      const counts = stats.data?.data?.counts || {};
      const liked = stats.data?.data?.liked || {};
      setHeartsByPostId((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          next[id] = {
            count: Number(counts[id] ?? counts[String(id)] ?? 0),
            liked: Boolean(liked[id] ?? liked[String(id)] ?? false),
          };
        });
        return next;
      });
    } catch {
      // ignore
    }
  };

  const getTaskId = (task) => {
    const raw = task?.task_id ?? task?.id ?? task?.taskId;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const usingMockTasks = ENABLE_MOCK_CHALLENGES && apiTasks.length === 0 && MOCK_WEEKLY_TASKS.length > 0;
  const weeklyTasks = usingMockTasks ? MOCK_WEEKLY_TASKS : apiTasks;
  const hasWeeklyAccess = totalXp >= WEEKLY_XP_THRESHOLD;

  const safePastChallenges = Array.isArray(pastChallenges) ? pastChallenges : [];
  const usingMockPast =
    ENABLE_MOCK_CHALLENGES && !pastLoading && !pastError && safePastChallenges.length === 0 && MOCK_PAST_CHALLENGES.length > 0;
  const effectivePastChallenges = usingMockPast ? MOCK_PAST_CHALLENGES : safePastChallenges;

  const tagSlug = useMemo(() => stripLeadingHash(tag).toLowerCase(), [tag]);
  const tagDisplay = useMemo(() => ensureLeadingHash(tagSlug), [tagSlug]);

  useEffect(() => {
    let alive = true;
    const loadTop = async () => {
      setTopHashtagsLoading(true);
      try {
        const res = await axiosPublic.get("/v1/hashtags/top", { params: { limit: 12 } });
        const rows = res.data?.data;
        if (!alive) return;
        setTopHashtags(Array.isArray(rows) ? rows : []);
      } catch {
        if (!alive) return;
        setTopHashtags([]);
      } finally {
        if (alive) setTopHashtagsLoading(false);
      }
    };

    loadTop();
    return () => {
      alive = false;
    };
  }, []);

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

  const formatChallengeDate = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
      hashtags: Array.isArray(post?.hashtags) ? post.hashtags : [],
      time: createdAtLabel,
      isAdmin: ADMIN_USERS.has(username.trim().toLowerCase()),
    };
  };

  const fetchPosts = async () => {
    setIsFetching(true);
    setFetchError('');
    try {
      let items = [];
      if (view === "tag" && tagSlug) {
        const res = await axiosPublic.get(`/v1/hashtags/${encodeURIComponent(tagSlug)}/posts`, {
          params: { limit: 50, offset: 0 },
        });
        items = Array.isArray(res?.data?.data) ? res.data.data : [];
      } else {
        const res = await getAllPosts();
        items = Array.isArray(res?.result) ? res.result : [];
      }
      const mapped = items.map(mapApiPostToComment);
      setComments(mapped);
      await fetchHeartStats(mapped.map((c) => c.id));
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
  }, [view, tagSlug]);

  useEffect(() => {
    // Refresh liked state after sign-in
    if (!comments.length) return;
    // Allow refetch for same ids when auth status changes
    lastHeartsFetchKeyRef.current = "";
    fetchHeartStats(comments.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
          const pid = Number(created.id);
          if (Number.isFinite(pid) && pid > 0) {
            setHeartsByPostId((prev) => ({
              ...prev,
              [pid]: prev[pid] || { count: 0, liked: false },
            }));
          }
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

  const toggleHeart = async (postIdRaw) => {
    const postId = Number(postIdRaw);
    if (!Number.isFinite(postId) || postId <= 0) return;

    const canReact = Boolean(isAuthenticated && user?.user_id && user?.role !== "admin");
    if (!canReact) {
      // Guests and admins can view counts but cannot react.
      return;
    }

    const current = heartsByPostId[postId] || { count: 0, liked: false };
    const nextLiked = !current.liked;
    const optimisticCount = Math.max(0, Number(current.count || 0) + (nextLiked ? 1 : -1));
    setHeartsByPostId((prev) => ({
      ...prev,
      [postId]: { count: optimisticCount, liked: nextLiked },
    }));

    try {
      if (nextLiked) {
        const res = await axiosPrivate.post(`/v1/post/${postId}/like`);
        const like_count = res.data?.like_count;
        if (like_count !== undefined) {
          setHeartsByPostId((prev) => ({
            ...prev,
            [postId]: { count: Number(like_count || 0), liked: true },
          }));
        }
      } else {
        const res = await axiosPrivate.delete(`/v1/post/${postId}/unlike`);
        const like_count = res.data?.like_count;
        if (like_count !== undefined) {
          setHeartsByPostId((prev) => ({
            ...prev,
            [postId]: { count: Number(like_count || 0), liked: false },
          }));
        }
      }
    } catch {
      // rollback on error
      setHeartsByPostId((prev) => ({
        ...prev,
        [postId]: current,
      }));
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

  const handleOpenWeeklyChallenge = (task) => {
    const taskId = getTaskId(task);
    if (!taskId) return;
    navigate(`/freedomwall/challenges/task/${encodeURIComponent(String(taskId))}`, {
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

  const renderPostText = (textRaw) => {
    const text = String(textRaw || "");
    const parts = text.split(/(#[A-Za-z0-9_]+)/g);

    return parts.map((part, idx) => {
      if (/^#[A-Za-z0-9_]+$/.test(part)) {
        const slug = stripLeadingHash(part).toLowerCase();
        return (
          <button
            key={`tag-${idx}-${slug}`}
            type="button"
            className="comment-hashtag"
            onClick={() => navigate(`/freedomwall/tags/${encodeURIComponent(slug)}`)}
            title={`View ${ensureLeadingHash(slug)}`}
          >
            {part}
          </button>
        );
      }

      return <React.Fragment key={`txt-${idx}`}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="community-shell">
    <div className={`community-page ${view === "challenges" ? "has-right" : "no-right"}`}>
      {/* ═══ Left Sidebar — Navigation ═══ */}
      <aside className="community-nav-rail">
        <div className="community-nav-fixed">
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
            <div className="community-nav-section-title">Top hashtags</div>
            <div className="community-nav-item-group">
              {topHashtagsLoading ? (
                <div className="community-nav-channel" aria-label="Loading hashtags">
                  <span className="channel-hash">#</span>
                  <span>Loading...</span>
                </div>
              ) : topHashtags.length > 0 ? (
                topHashtags.map((t) => {
                  const text = ensureLeadingHash(t?.hashtag_text);
                  const slug = stripLeadingHash(text).toLowerCase();
                  return (
                    <NavLink
                      key={slug}
                      to={`/freedomwall/tags/${encodeURIComponent(slug)}`}
                      className={({ isActive }) => `community-nav-channel ${isActive ? "is-active" : ""}`}
                      title={text}
                    >
                      <span className="channel-hash">#</span>
                      <span>{stripLeadingHash(text)}</span>
                    </NavLink>
                  );
                })
              ) : (
                <div className="community-nav-channel" aria-label="No hashtags">
                  <span className="channel-hash">#</span>
                  <span>No hashtags yet</span>
                </div>
              )}
            </div>
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

              {tasksError ? (
                <div className="challenges-banner" role="status">
                  {String(tasksError)}
                </div>
              ) : null}

              {tasksLoading ? (
                <div className="sidebar-loading">Loading challenges...</div>
              ) : (
                <>
                  {isAuthenticated && !hasWeeklyAccess ? (
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

                   {weeklyTasks.length === 0 ? (
                     <div className="sidebar-loading">
                       No weekly challenges yet.{isAdminPoster ? " Create one with + Add Task." : ""}
                     </div>
                   ) : (
                   <div className="challenges-wide-list">
                     {weeklyTasks.map((task) => {
                       const diff = DIFFICULTY_CONFIG[task.difficulty] || DIFFICULTY_CONFIG.medium;
                       const langMeta = getLanguageMeta(task);
                       const isCompleted = task.userStatus === "completed";
                       const isInProgress = task.userStatus === "in_progress";
                       const taskId = getTaskId(task) ?? task.task_id ?? task.id;
                       const expiresLabel = task.expires_at ? formatChallengeDate(task.expires_at) : "";
                       const cover = task.cover_image || task.coverImage || DEFAULT_CHALLENGE_COVER;

                      return (
                        <div
                          key={taskId}
                          className={`challenge-wide-card is-clickable ${isCompleted ? "is-done" : ""} ${isInProgress ? "is-progress" : ""}`}
                          role="button"
                          tabIndex={0}
                          title="Open weekly challenge"
                          onClick={() => handleOpenWeeklyChallenge(task)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleOpenWeeklyChallenge(task);
                            }
                          }}
                        >
                          <div className="challenge-wide-media" aria-hidden="true">
                            <img className="challenge-wide-img" src={cover} alt="" loading="lazy" />
                          </div>

                          <div className="challenge-wide-body">
                            <div className="challenge-wide-kicker">CODE CHALLENGE</div>
                            <div className="challenge-wide-title">
                              {task.title}
                            </div>
                            <div className="challenge-wide-desc">{task.description}</div>

                            <div className="challenge-wide-meta">
                              <span className="challenge-meta-item">
                                <CalendarDays size={14} />
                                {expiresLabel ? `Submit by ${expiresLabel}` : "Submit by -"}
                              </span>
                              <span className="challenge-meta-item">
                                <Zap size={14} />
                                +{task.reward_xp} XP
                              </span>
                              {task?.reward_cosmetic ? (
                                <span className="challenge-meta-item challenge-meta-prize" title={task.reward_cosmetic.name || "Cosmetic"}>
                                  <Trophy size={14} />
                                  {task.reward_cosmetic.asset_url ? (
                                    <img
                                      className="challenge-meta-thumb"
                                      src={task.reward_cosmetic.asset_url}
                                      alt=""
                                      loading="lazy"
                                      aria-hidden="true"
                                    />
                                  ) : null}
                                  {task.reward_cosmetic.name || "Cosmetic"}
                                </span>
                              ) : null}
                              <span className="challenge-meta-pill" style={{ color: diff.color, background: diff.bg }}>
                                {diff.label}
                              </span>

                              {langMeta ? (
                                <span
                                  className="challenge-meta-pill"
                                  style={{ color: langMeta.color, background: langMeta.bg }}
                                  title={langMeta.label}
                                >
                                  {langMeta.label}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className={`challenge-wide-actions ${!isAuthenticated ? "is-empty" : ""}`}>
                            {!isAuthenticated ? null : isCompleted ? (
                              <button
                                type="button"
                                className="challenge-wide-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartWeeklyChallenge(task);
                                }}
                              >
                                View
                                <ChevronRight size={14} />
                              </button>
                            ) : isInProgress ? (
                              <button
                                type="button"
                                className="challenge-wide-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartWeeklyChallenge(task);
                                }}
                              >
                                Continue
                                <ChevronRight size={14} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`challenge-wide-btn ${!hasWeeklyAccess ? "is-locked" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!hasWeeklyAccess) return;
                                  handleStartWeeklyChallenge(task);
                                }}
                                disabled={!hasWeeklyAccess}
                              >
                                {hasWeeklyAccess ? (
                                  <>
                                    Accept
                                    <ChevronRight size={14} />
                                  </>
                                ) : (
                                  "Locked"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                   </div>
                   )}
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
                    const langMeta = getLanguageMeta(t);
                    const ended = t.expires_at ? new Date(t.expires_at) : null;

                    return (
                      <button
                        key={`past-${t.task_id}`}
                        type="button"
                        className="past-card past-card-button"
                        onClick={() => navigate(`/freedomwall/challenges/past/${encodeURIComponent(String(t.task_id))}`)}
                        title="View past challenge"
                      >
                          <div className="challenge-wide-card past-wide" role="group">
                            <div className="challenge-wide-media" aria-hidden="true">
                              <img
                                className="challenge-wide-img"
                                src={t.cover_image || t.coverImage || DEFAULT_CHALLENGE_COVER}
                                alt=""
                                loading="lazy"
                              />
                            </div>

                            <div className="challenge-wide-body">
                              <div className="challenge-wide-kicker">CODE CHALLENGE</div>
                              <div className="challenge-wide-title">{t.title}</div>
                              <div className="challenge-wide-desc">{t.description}</div>

                              <div className="challenge-wide-meta">
                                <span className="challenge-meta-item">
                                  <CalendarDays size={14} />
                                  {ended ? `Ended ${formatChallengeDate(ended)}` : "Ended -"}
                                </span>
                                <span className="challenge-meta-item">
                                  <Users size={14} />
                                  {Number(t.participants_count || 0)} participated
                                </span>
                                <span className="challenge-meta-pill" style={{ color: diff.color, background: diff.bg }}>
                                  {diff.label}
                                </span>

                                {langMeta ? (
                                  <span
                                    className="challenge-meta-pill"
                                    style={{ color: langMeta.color, background: langMeta.bg }}
                                    title={langMeta.label}
                                  >
                                    {langMeta.label}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="challenge-wide-actions">
                              <div className="past-view">
                                View
                                <ChevronRight size={14} />
                              </div>
                            </div>
                          </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {view === "tag" ? (
              <div className="challenges-hero" style={{ paddingTop: 0 }}>
                <div className="challenges-hero-badge">
                  <Hash size={18} />
                  {tagDisplay || "#tag"}
                </div>
              </div>
            ) : null}
            {/* Search Bar */}
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder={view === "tag" ? `Search ${tagDisplay || "#tag"} posts...` : "Search posts..."}
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
                      <p className="comment-text">{renderPostText(comment.text)}</p>

                      <div className="comment-actions">
                        {isAuthenticated && user?.role !== "admin" ? (
                          <button
                            type="button"
                            className={`heart-btn ${heartsByPostId[Number(comment.id)]?.liked ? "is-liked" : ""}`}
                            onClick={() => toggleHeart(comment.id)}
                            aria-label="React with a heart"
                            title="Heart"
                          >
                            <Heart size={16} />
                            <span className="heart-count">{Number(heartsByPostId[Number(comment.id)]?.count || 0)}</span>
                          </button>
                        ) : (
                          <div className="heart-pill" aria-label="Hearts">
                            <Heart size={16} />
                            <span className="heart-count">{Number(heartsByPostId[Number(comment.id)]?.count || 0)}</span>
                          </div>
                        )}
                      </div>
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
