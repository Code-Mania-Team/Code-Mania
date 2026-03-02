import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosPublic } from "../api/axios";
import useAuth from "../hooks/useAxios";
import { BarChart3, Database } from "lucide-react";
import styles from "../styles/Admin.module.css";
import AuthLoadingOverlay from "../components/AuthLoadingOverlay";

function Admin() {
  const ATTEMPTS_PER_PAGE = 10;
  const EXPORT_RANGE_OPTIONS = [
    { value: '1week', label: '1 week', days: 7 },
    { value: '1month', label: '1 month', days: 30 },
    { value: '1year', label: '1 year', days: 365 },
  ];

  const getRangeDays = (rangeValue) => {
    const selected = EXPORT_RANGE_OPTIONS.find((option) => option.value === rangeValue);
    return selected?.days || 7;
  };

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const downloadCsv = (filename, headers, rows) => {
    const csvLines = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const filterAttemptsByRange = (attempts, rangeValue) => {
    const days = getRangeDays(rangeValue);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return (attempts || []).filter((attempt) => {
      if (!attempt?.submittedAt) return false;
      return new Date(attempt.submittedAt) >= startDate;
    });
  };

  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const [status, setStatus] = useState("loading");
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState('');
  const [metricsInFlight, setMetricsInFlight] = useState(false);
  const [quizMetrics, setQuizMetrics] = useState(null);
  const [quizMetricsLoading, setQuizMetricsLoading] = useState(false);
  const [quizMetricsError, setQuizMetricsError] = useState('');
  const [userQuizSummary, setUserQuizSummary] = useState([]);
  const [userQuizSummaryLoading, setUserQuizSummaryLoading] = useState(false);
  const [userQuizSummaryError, setUserQuizSummaryError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserAttempts, setSelectedUserAttempts] = useState([]);
  const [selectedUserAttemptsLoading, setSelectedUserAttemptsLoading] = useState(false);
  const [selectedUserAttemptsError, setSelectedUserAttemptsError] = useState('');
  const [examMetrics, setExamMetrics] = useState(null);
  const [examMetricsLoading, setExamMetricsLoading] = useState(false);
  const [examMetricsError, setExamMetricsError] = useState('');
  const [userExamSummary, setUserExamSummary] = useState([]);
  const [userExamSummaryLoading, setUserExamSummaryLoading] = useState(false);
  const [userExamSummaryError, setUserExamSummaryError] = useState('');
  const [selectedExamUser, setSelectedExamUser] = useState(null);
  const [selectedExamAttempts, setSelectedExamAttempts] = useState([]);
  const [selectedExamAttemptsLoading, setSelectedExamAttemptsLoading] = useState(false);
  const [selectedExamAttemptsError, setSelectedExamAttemptsError] = useState('');
  const [quizAttemptsPage, setQuizAttemptsPage] = useState(1);
  const [examAttemptsPage, setExamAttemptsPage] = useState(1);
  const [quizExportRange, setQuizExportRange] = useState('1week');
  const [examExportRange, setExamExportRange] = useState('1week');
  const [quizSummaryExportRange, setQuizSummaryExportRange] = useState('1week');
  const [examSummaryExportRange, setExamSummaryExportRange] = useState('1week');

  const quizAttempts = quizMetrics?.attempts || [];
  const examAttempts = examMetrics?.attempts || [];

  const quizTotalPages = Math.max(1, Math.ceil(quizAttempts.length / ATTEMPTS_PER_PAGE));
  const examTotalPages = Math.max(1, Math.ceil(examAttempts.length / ATTEMPTS_PER_PAGE));

  const paginatedQuizAttempts = quizAttempts.slice((quizAttemptsPage - 1) * ATTEMPTS_PER_PAGE, quizAttemptsPage * ATTEMPTS_PER_PAGE);
  const paginatedExamAttempts = examAttempts.slice((examAttemptsPage - 1) * ATTEMPTS_PER_PAGE, examAttemptsPage * ATTEMPTS_PER_PAGE);

  const quizAttemptsInExportRange = filterAttemptsByRange(quizAttempts, quizExportRange);
  const examAttemptsInExportRange = filterAttemptsByRange(examAttempts, examExportRange);

  const quizSummaryInExportRange = (userQuizSummary || []).filter((user) => {
    if (!user?.latestAttemptAt) return false;
    const days = getRangeDays(quizSummaryExportRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return new Date(user.latestAttemptAt) >= startDate;
  });

  const examSummaryInExportRange = (userExamSummary || []).filter((user) => {
    if (!user?.latestAttemptAt) return false;
    const days = getRangeDays(examSummaryExportRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return new Date(user.latestAttemptAt) >= startDate;
  });

  const exportQuizAttemptsCsv = () => {
    const rows = quizAttemptsInExportRange.map((attempt) => [
      attempt.username || '-',
      attempt.language || '-',
      attempt.quizTitle || '-',
      attempt.scorePercentage ?? '-',
      attempt.totalCorrect ?? '-',
      attempt.totalQuestions ?? '-',
      attempt.earnedXp ?? '-',
      attempt.isPassed ? 'Passed' : 'Failed',
      attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-',
    ]);

    downloadCsv(
      `quiz-attempts-${quizExportRange}-${new Date().toISOString().slice(0, 10)}.csv`,
      ['User', 'Language', 'Quiz', 'Score (%)', 'Correct', 'Total Questions', 'XP', 'Status', 'Submitted'],
      rows
    );
  };

  const exportExamAttemptsCsv = () => {
    const rows = examAttemptsInExportRange.map((attempt) => [
      attempt.username || '-',
      attempt.language || '-',
      attempt.examTitle || '-',
      attempt.attemptNumber ?? '-',
      attempt.scorePercentage ?? '-',
      attempt.isPassed ? 'Passed' : 'Failed',
      attempt.earnedXp ?? '-',
      attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-',
    ]);

    downloadCsv(
      `exam-attempts-${examExportRange}-${new Date().toISOString().slice(0, 10)}.csv`,
      ['User', 'Language', 'Exam', 'Attempt #', 'Score (%)', 'Status', 'XP', 'Submitted'],
      rows
    );
  };

  const exportQuizSummaryCsv = () => {
    const rows = quizSummaryInExportRange.map((user) => [
      user.username || '-',
      user.totalAttempts ?? '-',
      user.averageScore ?? '-',
      user.passRate ?? '-',
      user.bestScore ?? '-',
      (user.languages || []).join(', '),
      user.latestAttemptAt ? new Date(user.latestAttemptAt).toLocaleString() : '-',
    ]);

    downloadCsv(
      `quiz-performance-${quizSummaryExportRange}-${new Date().toISOString().slice(0, 10)}.csv`,
      ['User', 'Attempts', 'Average Score (%)', 'Pass Rate (%)', 'Best Score (%)', 'Languages', 'Latest Attempt'],
      rows
    );
  };

  const exportExamSummaryCsv = () => {
    const rows = examSummaryInExportRange.map((user) => [
      user.username || '-',
      user.totalAttempts ?? '-',
      user.averageScore ?? '-',
      user.passRate ?? '-',
      user.bestScore ?? '-',
      user.totalXpAwarded ?? '-',
      (user.languages || []).join(', '),
      user.latestAttemptAt ? new Date(user.latestAttemptAt).toLocaleString() : '-',
    ]);

    downloadCsv(
      `exam-performance-${examSummaryExportRange}-${new Date().toISOString().slice(0, 10)}.csv`,
      ['User', 'Attempts', 'Average Score (%)', 'Pass Rate (%)', 'Best Score (%)', 'XP Awarded', 'Languages', 'Latest Attempt'],
      rows
    );
  };

  const fetchDatasets = async () => {
    setDatasetsLoading(true);
    try {
      const courses = [
        { course: 'python', languageId: 1, name: 'Python Quests' },
        { course: 'cpp', languageId: 2, name: 'C++ Quests' },
        { course: 'javascript', languageId: 3, name: 'JavaScript Quests' },
      ];

      const responses = await Promise.all(
        courses.map((item) =>
          axiosPublic.get(`/v1/exercises/programming-language/${item.languageId}`, { withCredentials: true })
        )
      );

      const formattedDatasets = courses.map((item, index) => {
        const rows = responses[index]?.data?.data || [];
        const total = rows.length;
        const published = rows.filter((row) => row?.status === 'published').length;
        const draft = rows.filter((row) => row?.status === 'draft').length;

        const latestTimestamp = rows.reduce((latest, row) => {
          const candidate = row?.updated_at || row?.created_at;
          if (!candidate) return latest;
          if (!latest) return candidate;
          return new Date(candidate) > new Date(latest) ? candidate : latest;
        }, null);

        return {
          name: item.name,
          course: item.course,
          total,
          published,
          draft,
          updatedAt: latestTimestamp ? new Date(latestTimestamp).toLocaleDateString() : '-',
        };
      });

      setDatasets(formattedDatasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      // Fallback to demo data on error
      setDatasets([
        { name: "Python Quests", course: "python", total: 0, published: 0, draft: 0, status: "draft", updatedAt: "Today" },
        { name: "C++ Quests", course: "cpp", total: 0, published: 0, draft: 0, status: "published", updatedAt: "Yesterday" },
        { name: "JavaScript Quests", course: "javascript", total: 0, published: 0, draft: 0, status: "draft", updatedAt: "2 days ago" },
      ]);
    } finally {
      setDatasetsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await axiosPublic.get("/v1/analytics/exam-analytics", { withCredentials: true });
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Fallback to demo data on error
      setAnalytics({
        total_exams_taken: 3,
        mean_exam_grade: 85.3,
        median_exam_grade: 85.5,
        mode_retake_count: 0,
        avg_exam_duration_minutes: 195,
        daily_exam_completions: [
          { date: "2025-02-10", exams_completed: 1, avg_grade: 85.5 },
          { date: "2025-02-11", exams_completed: 0, avg_grade: 0 },
          { date: "2025-02-12", exams_completed: 1, avg_grade: 92.0 },
          { date: "2025-02-13", exams_completed: 0, avg_grade: 0 },
          { date: "2025-02-14", exams_completed: 0, avg_grade: 0 }
        ],
        user_exam_data: [
          {
            user_id: "user_001",
            email: "student1@example.com",
            programming_language: "python",
            final_exam_grade: 85.5,
            retake_count: 1,
            exam_activated_date: "2025-02-10T10:30:00Z",
            exam_close_date: "2025-02-10T14:45:00Z",
            exam_duration_minutes: 255
          }
        ]
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    if (metricsInFlight) return;
    setMetricsInFlight(true);
    setMetricsLoading(true);
    setMetricsError('');
    try {
      const response = await axiosPublic.get('/v1/metrics/admin-summary', { withCredentials: true });
      if (response.data?.success) {
        setMetrics(response.data.data || null);
      } else {
        setMetrics(null);
        setMetricsError(response.data?.message || 'Failed to fetch metrics');
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics(null);
      setMetricsError(error?.response?.data?.message || error?.message || 'Failed to fetch metrics');
    } finally {
      setMetricsLoading(false);
      setMetricsInFlight(false);
    }
  };

  const fetchQuizMetrics = async () => {
    setQuizMetricsLoading(true);
    setQuizMetricsError('');
    try {
      const response = await axiosPublic.get('/v1/metrics/quiz-attempts', { withCredentials: true });
      if (response.data?.success) {
        setQuizMetrics(response.data.data || null);
      } else {
        setQuizMetrics(null);
        setQuizMetricsError(response.data?.message || 'Failed to fetch quiz metrics');
      }
    } catch (error) {
      console.error('Error fetching quiz metrics:', error);
      setQuizMetrics(null);
      setQuizMetricsError(error?.response?.data?.message || error?.message || 'Failed to fetch quiz metrics');
    } finally {
      setQuizMetricsLoading(false);
    }
  };

  const fetchUserQuizSummary = async () => {
    setUserQuizSummaryLoading(true);
    setUserQuizSummaryError('');
    try {
      const response = await axiosPublic.get('/v1/metrics/quiz-attempts/by-user', { withCredentials: true });
      if (response.data?.success) {
        setUserQuizSummary(response.data?.data?.users || []);
      } else {
        setUserQuizSummary([]);
        setUserQuizSummaryError(response.data?.message || 'Failed to fetch per-user quiz performance');
      }
    } catch (error) {
      console.error('Error fetching per-user quiz summary:', error);
      setUserQuizSummary([]);
      setUserQuizSummaryError(error?.response?.data?.message || error?.message || 'Failed to fetch per-user quiz performance');
    } finally {
      setUserQuizSummaryLoading(false);
    }
  };

  const fetchUserQuizAttempts = async (userRow) => {
    if (!userRow?.userId) return;

    setSelectedUser(userRow);
    setSelectedUserAttemptsLoading(true);
    setSelectedUserAttemptsError('');
    try {
      const response = await axiosPublic.get(`/v1/metrics/quiz-attempts/by-user/${userRow.userId}`, { withCredentials: true });
      if (response.data?.success) {
        setSelectedUserAttempts(response.data?.data?.attempts || []);
      } else {
        setSelectedUserAttempts([]);
        setSelectedUserAttemptsError(response.data?.message || 'Failed to fetch user attempt history');
      }
    } catch (error) {
      console.error('Error fetching user attempt history:', error);
      setSelectedUserAttempts([]);
      setSelectedUserAttemptsError(error?.response?.data?.message || error?.message || 'Failed to fetch user attempt history');
    } finally {
      setSelectedUserAttemptsLoading(false);
    }
  };

  const fetchExamMetrics = async () => {
    setExamMetricsLoading(true);
    setExamMetricsError('');
    try {
      const response = await axiosPublic.get('/v1/metrics/exam-attempts', { withCredentials: true });
      if (response.data?.success) {
        setExamMetrics(response.data.data || null);
      } else {
        setExamMetrics(null);
        setExamMetricsError(response.data?.message || 'Failed to fetch exam metrics');
      }
    } catch (error) {
      console.error('Error fetching exam metrics:', error);
      setExamMetrics(null);
      setExamMetricsError(error?.response?.data?.message || error?.message || 'Failed to fetch exam metrics');
    } finally {
      setExamMetricsLoading(false);
    }
  };

  const fetchUserExamSummary = async () => {
    setUserExamSummaryLoading(true);
    setUserExamSummaryError('');
    try {
      const response = await axiosPublic.get('/v1/metrics/exam-attempts/by-user', { withCredentials: true });
      if (response.data?.success) {
        setUserExamSummary(response.data?.data?.users || []);
      } else {
        setUserExamSummary([]);
        setUserExamSummaryError(response.data?.message || 'Failed to fetch per-user exam performance');
      }
    } catch (error) {
      console.error('Error fetching per-user exam summary:', error);
      setUserExamSummary([]);
      setUserExamSummaryError(error?.response?.data?.message || error?.message || 'Failed to fetch per-user exam performance');
    } finally {
      setUserExamSummaryLoading(false);
    }
  };

  const fetchUserExamAttempts = async (userRow) => {
    if (!userRow?.userId) return;

    setSelectedExamUser(userRow);
    setSelectedExamAttemptsLoading(true);
    setSelectedExamAttemptsError('');
    try {
      const response = await axiosPublic.get(`/v1/metrics/exam-attempts/by-user/${userRow.userId}`, { withCredentials: true });
      if (response.data?.success) {
        setSelectedExamAttempts(response.data?.data?.attempts || []);
      } else {
        setSelectedExamAttempts([]);
        setSelectedExamAttemptsError(response.data?.message || 'Failed to fetch exam attempt history');
      }
    } catch (error) {
      console.error('Error fetching exam attempt history:', error);
      setSelectedExamAttempts([]);
      setSelectedExamAttemptsError(error?.response?.data?.message || error?.message || 'Failed to fetch exam attempt history');
    } finally {
      setSelectedExamAttemptsLoading(false);
    }
  };

  const demo = {
    
    signupsPerDay: [
      { day: "Mon", count: 0 },
      { day: "Tue", count: 0 },
      { day: "Wed", count: 0 },
      { day: "Thu", count: 0 },
      { day: "Fri", count: 0 },
      { day: "Sat", count: 0 },
      { day: "Sun", count: 0 },
    ],
    courseStarts: [
      { name: "Python", started: 18 },
      { name: "JavaScript", started: 14 },
      { name: "C++", started: 9 },
    ],
    datasets: [],
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await axiosPublic.get("/v1/account", { withCredentials: true });
        const p = res?.data?.data || null;

        if (!cancelled) {
          setProfile(p);
          const ok = res?.data?.success === true;
          if (!ok || !p?.user_id) {
            setUser(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
            setStatus("unauthenticated");
            return;
          }

          setUser(p);
          setIsAuthenticated(true);

          const allowed = p?.role === "admin";
          setIsAdmin(allowed);
          setStatus("ok");
          
          // Fetch datasets and analytics when admin is authenticated
          if (allowed && !cancelled) {
            fetchDatasets();
            fetchMetrics();
            fetchQuizMetrics();
            fetchUserQuizSummary();
            fetchExamMetrics();
            fetchUserExamSummary();
          }
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setQuizAttemptsPage(1);
  }, [quizAttempts.length]);

  useEffect(() => {
    setExamAttemptsPage(1);
  }, [examAttempts.length]);

  if (status === "loading") {
    return <AuthLoadingOverlay />;
  }

  if (status === "unauthenticated") {
    return (
      <div className={styles.state}>
        <h1>Admin</h1>
        <p>You must be signed in to view this page.</p>
        <button className={styles.button} type="button" onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.state}>
        <h1>Admin</h1>
        <p>Could not load your profile.</p>
        <button className={styles.button} type="button" onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.state}>
        <h1>Admin</h1>
        <p>403 - Not authorized.</p>
        <p style={{ opacity: 0.8 }}>
          This page is restricted to the admin account.
        </p>
        <button className={styles.button} type="button" onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle }) => (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardValue}>{value}</div>
      {subtitle ? <div className={styles.cardSubtitle}>{subtitle}</div> : null}
    </div>
  );

  const RangeSelector = ({ value, onChange }) => (
    <div className={styles.rangePicker} role="group" aria-label="Export range">
      {EXPORT_RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`${styles.rangeButton} ${value === option.value ? styles.rangeButtonActive : ''}`}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Admin</h1>
          <p className={styles.heroDescription}>
            Monitor users and courses. Manage datasets and keep track of growth.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <BarChart3 className={styles.icon} />
            <h2 className={styles.title}>Analytics</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={styles.button} type="button" onClick={fetchMetrics} disabled={metricsLoading}>Refresh</button>
            <button className={styles.button} type="button" onClick={() => navigate("/")}>Back to site</button>
          </div>
        </div>

        <div className={styles.grid}>
          <StatCard title="Total Users" value={metricsLoading ? '…' : (metrics?.totalUsers ?? demo.totalUsers)} />
          <StatCard title="New Users (7 days)" value={metricsLoading ? '…' : (metrics?.newUsers7d ?? demo.newUsers7d)} />
          <StatCard title="New Users (30 days)" value={metricsLoading ? '…' : (metrics?.newUsers30d ?? 0)} />
          <StatCard title="New Users (1 year)" value={metricsLoading ? '…' : (metrics?.newUsers365d ?? 0)} />
        </div>

        <div className={styles.panels}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Users Overview</h3>
            <p className={styles.panelSubtitle}>Signups per day</p>
            <div className={styles.divider}>
              {(metrics?.signupsPerDay?.length ? metrics.signupsPerDay : demo.signupsPerDay).map((d) => (
                <div key={d.day} className={styles.row}>
                  <div className={styles.day}>{d.day}</div>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{ width: `${Math.min(100, d.count * 20)}%` }} />
                  </div>
                  <div className={styles.count}>{d.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Course Analytics</h3>
            <p className={styles.panelSubtitle}>Starts per course</p>
              <div className={styles.divider}>
              {(metrics?.courseStarts?.length ? metrics.courseStarts : demo.courseStarts).map((c) => (
                <div key={c.name} className={styles.courseRow}>
                  <div className={styles.courseName}>{c.name}</div>
                  <div className={styles.courseMeta}>{c.started} started</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className={styles.header} style={{ marginTop: 24 }}>
          <div className={styles.headerLeft}>
            <BarChart3 className={styles.icon} />
            <h2 className={styles.title}>Quiz Analytics & Statistics</h2>
          </div>
        </div>

        <div className={styles.grid}>
          <StatCard title="Quiz Attempts" value={quizMetricsLoading ? '…' : (quizMetrics?.totalAttempts ?? 0)} />
          <StatCard title="Average Score" value={quizMetricsLoading ? '…' : `${quizMetrics?.averageScore ?? 0}%`} />
          <StatCard title="Pass Rate" value={quizMetricsLoading ? '…' : `${quizMetrics?.passRate ?? 0}%`} />
          <StatCard title="XP Awarded" value={quizMetricsLoading ? '…' : (quizMetrics?.totalXpAwarded ?? 0)} />
        </div>

        {quizMetricsError ? <p className={styles.errorText}>{quizMetricsError}</p> : null}

        <div className={styles.panel} style={{ marginTop: 12 }}>
          <div className={styles.quizHeaderRow}>
            <h3 className={styles.panelTitle}>Latest Quiz Attempts</h3>
            <div className={styles.inlineActions}>
              <button className={styles.button} type="button" onClick={fetchQuizMetrics} disabled={quizMetricsLoading}>
                Refresh Quiz Data
              </button>
              <RangeSelector value={quizExportRange} onChange={setQuizExportRange} />
              <button
                className={styles.button}
                type="button"
                onClick={exportQuizAttemptsCsv}
                disabled={quizAttemptsInExportRange.length === 0}
              >
                Export Quiz CSV
              </button>
            </div>
          </div>

          <div className={styles.quizTableWrap}>
            <table className={styles.quizTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Language</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>XP</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {quizAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.quizEmpty}>No quiz attempts found.</td>
                  </tr>
                ) : (
                  paginatedQuizAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>{attempt.username}</td>
                      <td>{attempt.language}</td>
                      <td>{attempt.quizTitle}</td>
                      <td className={attempt.isPassed ? styles.passed : styles.failed}>{attempt.scorePercentage}%</td>
                      <td>{attempt.totalCorrect}/{attempt.totalQuestions}</td>
                      <td>{attempt.earnedXp}</td>
                      <td>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {quizAttempts.length > 0 ? (
            <div className={styles.paginationRow}>
              <div className={styles.paginationInfo}>Page {quizAttemptsPage} of {quizTotalPages}</div>
              <div className={styles.inlineActions}>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => setQuizAttemptsPage((page) => Math.max(1, page - 1))}
                  disabled={quizAttemptsPage === 1}
                >
                  Previous
                </button>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => setQuizAttemptsPage((page) => Math.min(quizTotalPages, page + 1))}
                  disabled={quizAttemptsPage === quizTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {selectedUser ? (
          <div className={styles.panel} style={{ marginTop: 12 }}>
            <div className={styles.quizHeaderRow}>
              <h3 className={styles.panelTitle}>Attempt History: {selectedUser.username}</h3>
              <div className={styles.inlineActions}>
                <button className={styles.button} type="button" onClick={() => fetchUserQuizAttempts(selectedUser)} disabled={selectedUserAttemptsLoading}>
                  Refresh History
                </button>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedUserAttempts([]);
                    setSelectedUserAttemptsError('');
                  }}
                >
                  Back to Users
                </button>
              </div>
            </div>
            {selectedUserAttemptsError ? <p className={styles.errorText}>{selectedUserAttemptsError}</p> : null}
            <div className={styles.quizTableWrap}>
              <table className={styles.quizTable}>
                <thead>
                  <tr>
                    <th>Language</th>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Correct</th>
                    <th>XP</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUserAttemptsLoading ? (
                    <tr>
                      <td colSpan={6} className={styles.quizEmpty}>Loading attempt history...</td>
                    </tr>
                  ) : selectedUserAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.quizEmpty}>No attempts found for this user.</td>
                    </tr>
                  ) : (
                    selectedUserAttempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td>{attempt.language}</td>
                        <td>{attempt.quizTitle}</td>
                        <td className={attempt.isPassed ? styles.passed : styles.failed}>{attempt.scorePercentage}%</td>
                        <td>{attempt.totalCorrect}/{attempt.totalQuestions}</td>
                        <td>{attempt.earnedXp}</td>
                        <td>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.panel} style={{ marginTop: 16 }}>
            <div className={styles.quizHeaderRow}>
              <h3 className={styles.panelTitle}>User Quiz Performance</h3>
              <div className={styles.inlineActions}>
                <button className={styles.button} type="button" onClick={fetchUserQuizSummary} disabled={userQuizSummaryLoading}>
                  Refresh Users
                </button>
                <RangeSelector value={quizSummaryExportRange} onChange={setQuizSummaryExportRange} />
                <button
                  className={styles.button}
                  type="button"
                  onClick={exportQuizSummaryCsv}
                  disabled={quizSummaryInExportRange.length === 0}
                >
                  Export Performance CSV
                </button>
              </div>
            </div>

            {userQuizSummaryError ? <p className={styles.errorText}>{userQuizSummaryError}</p> : null}

            <div className={styles.quizTableWrap}>
              <table className={styles.quizTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Attempts</th>
                    <th>Avg Score</th>
                    <th>Pass Rate</th>
                    <th>Best Score</th>
                    <th>Languages</th>
                    <th>Latest</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {userQuizSummaryLoading ? (
                    <tr>
                      <td colSpan={8} className={styles.quizEmpty}>Loading user quiz data...</td>
                    </tr>
                  ) : userQuizSummary.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.quizEmpty}>No user quiz data found.</td>
                    </tr>
                  ) : (
                    userQuizSummary.map((user) => (
                      <tr key={user.userId}>
                        <td>{user.username}</td>
                        <td>{user.totalAttempts}</td>
                        <td>{user.averageScore}%</td>
                        <td>{user.passRate}%</td>
                        <td>{user.bestScore}%</td>
                        <td>{(user.languages || []).join(', ')}</td>
                        <td>{user.latestAttemptAt ? new Date(user.latestAttemptAt).toLocaleString() : '-'}</td>
                        <td>
                          <button className={styles.button} type="button" onClick={() => fetchUserQuizAttempts(user)}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        <div className={styles.header} style={{ marginTop: 24 }}>
          <div className={styles.headerLeft}>
            <BarChart3 className={styles.icon} />
            <h2 className={styles.title}>Exam Analytics & Statistics</h2>
          </div>
        </div>

        <div className={styles.grid}>
          <StatCard title="Exam Attempts" value={examMetricsLoading ? '…' : (examMetrics?.totalAttempts ?? 0)} />
          <StatCard title="Average Score" value={examMetricsLoading ? '…' : `${examMetrics?.averageScore ?? 0}%`} />
          <StatCard title="Pass Rate" value={examMetricsLoading ? '…' : `${examMetrics?.passRate ?? 0}%`} />
          <StatCard title="XP Awarded" value={examMetricsLoading ? '…' : (examMetrics?.totalXpAwarded ?? 0)} />
        </div>

        {examMetricsError ? <p className={styles.errorText}>{examMetricsError}</p> : null}

        <div className={styles.panel} style={{ marginTop: 12 }}>
          <div className={styles.quizHeaderRow}>
            <h3 className={styles.panelTitle}>Latest Exam Attempts</h3>
            <div className={styles.inlineActions}>
              <button className={styles.button} type="button" onClick={fetchExamMetrics} disabled={examMetricsLoading}>
                Refresh Exam Data
              </button>
              <RangeSelector value={examExportRange} onChange={setExamExportRange} />
              <button
                className={styles.button}
                type="button"
                onClick={exportExamAttemptsCsv}
                disabled={examAttemptsInExportRange.length === 0}
              >
                Export Exam CSV
              </button>
            </div>
          </div>

          <div className={styles.quizTableWrap}>
            <table className={styles.quizTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Language</th>
                  <th>Exam</th>
                  <th>Attempt</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>XP</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {examAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.quizEmpty}>No exam attempts found.</td>
                  </tr>
                ) : (
                  paginatedExamAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>{attempt.username}</td>
                      <td>{attempt.language}</td>
                      <td>{attempt.examTitle}</td>
                      <td>{attempt.attemptNumber}</td>
                      <td className={attempt.isPassed ? styles.passed : styles.failed}>{attempt.scorePercentage}%</td>
                      <td className={attempt.isPassed ? styles.passed : styles.failed}>{attempt.isPassed ? 'Passed' : 'Failed'}</td>
                      <td>{attempt.earnedXp}</td>
                      <td>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {examAttempts.length > 0 ? (
            <div className={styles.paginationRow}>
              <div className={styles.paginationInfo}>Page {examAttemptsPage} of {examTotalPages}</div>
              <div className={styles.inlineActions}>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => setExamAttemptsPage((page) => Math.max(1, page - 1))}
                  disabled={examAttemptsPage === 1}
                >
                  Previous
                </button>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => setExamAttemptsPage((page) => Math.min(examTotalPages, page + 1))}
                  disabled={examAttemptsPage === examTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {selectedExamUser ? (
          <div className={styles.panel} style={{ marginTop: 12 }}>
            <div className={styles.quizHeaderRow}>
              <h3 className={styles.panelTitle}>Exam Attempt History: {selectedExamUser.username}</h3>
              <div className={styles.inlineActions}>
                <button className={styles.button} type="button" onClick={() => fetchUserExamAttempts(selectedExamUser)} disabled={selectedExamAttemptsLoading}>
                  Refresh History
                </button>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => {
                    setSelectedExamUser(null);
                    setSelectedExamAttempts([]);
                    setSelectedExamAttemptsError('');
                  }}
                >
                  Back to Users
                </button>
              </div>
            </div>
            {selectedExamAttemptsError ? <p className={styles.errorText}>{selectedExamAttemptsError}</p> : null}
            <div className={styles.quizTableWrap}>
              <table className={styles.quizTable}>
                <thead>
                  <tr>
                    <th>Language</th>
                    <th>Exam</th>
                    <th>Attempt</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>XP</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedExamAttemptsLoading ? (
                    <tr>
                      <td colSpan={7} className={styles.quizEmpty}>Loading exam attempt history...</td>
                    </tr>
                  ) : selectedExamAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.quizEmpty}>No exam attempts found for this user.</td>
                    </tr>
                  ) : (
                    selectedExamAttempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td>{attempt.language}</td>
                        <td>{attempt.examTitle}</td>
                        <td>{attempt.attemptNumber}</td>
                        <td className={attempt.isPassed ? styles.passed : styles.failed}>{attempt.scorePercentage}%</td>
                        <td className={attempt.isPassed ? styles.passed : styles.failed}>{attempt.isPassed ? 'Passed' : 'Failed'}</td>
                        <td>{attempt.earnedXp}</td>
                        <td>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.panel} style={{ marginTop: 16 }}>
            <div className={styles.quizHeaderRow}>
              <h3 className={styles.panelTitle}>User Exam Performance</h3>
              <div className={styles.inlineActions}>
                <button className={styles.button} type="button" onClick={fetchUserExamSummary} disabled={userExamSummaryLoading}>
                  Refresh Users
                </button>
                <RangeSelector value={examSummaryExportRange} onChange={setExamSummaryExportRange} />
                <button
                  className={styles.button}
                  type="button"
                  onClick={exportExamSummaryCsv}
                  disabled={examSummaryInExportRange.length === 0}
                >
                  Export Performance CSV
                </button>
              </div>
            </div>

            {userExamSummaryError ? <p className={styles.errorText}>{userExamSummaryError}</p> : null}

            <div className={styles.quizTableWrap}>
              <table className={styles.quizTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Attempts</th>
                    <th>Avg Score</th>
                    <th>Pass Rate</th>
                    <th>Best Score</th>
                    <th>XP Awarded</th>
                    <th>Languages</th>
                    <th>Latest</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {userExamSummaryLoading ? (
                    <tr>
                      <td colSpan={9} className={styles.quizEmpty}>Loading user exam data...</td>
                    </tr>
                  ) : userExamSummary.length === 0 ? (
                    <tr>
                      <td colSpan={9} className={styles.quizEmpty}>No user exam data found.</td>
                    </tr>
                  ) : (
                    userExamSummary.map((user) => (
                      <tr key={user.userId}>
                        <td>{user.username}</td>
                        <td>{user.totalAttempts}</td>
                        <td>{user.averageScore}%</td>
                        <td>{user.passRate}%</td>
                        <td>{user.bestScore}%</td>
                        <td>{user.totalXpAwarded}</td>
                        <td>{(user.languages || []).join(', ')}</td>
                        <td>{user.latestAttemptAt ? new Date(user.latestAttemptAt).toLocaleString() : '-'}</td>
                        <td>
                          <button className={styles.button} type="button" onClick={() => fetchUserExamAttempts(user)}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={styles.header} style={{ marginTop: 18 }}>
          <div className={styles.headerLeft}>
            <Database className={styles.icon} />
            <h2 className={styles.title}>Quests Database</h2>
          </div>
        </div>

        {datasetsLoading ? (
          <div className={styles.panel}>
            <p>Loading datasets...</p>
          </div>
        ) : (
          <div className={styles.panel}>
            <div className={styles.divider} style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              {datasets.length === 0 ? (
                <p>No quest collections found.</p>
              ) : (
                datasets.map((d) => (
                  <div key={d.course || d.name} className={styles.datasetRow}>
                    <div className={styles.datasetLeft}>
                      <div className={styles.datasetName}>{d.name}</div>
                      <div className={styles.datasetMeta}>
                        {d.total} exercises · {d.published} published · {d.draft} draft · Updated: {d.updatedAt}
                      </div>
                    </div>
                    <div className={styles.datasetActions}>
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() => navigate(`/admin/exercises/${d.course}`)}
                        disabled={!d.course}
                      >
                        Edit Quests
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Admin;
