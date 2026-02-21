import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosPublic } from "../api/axios";
import { BarChart3, Database } from "lucide-react";
import styles from "../styles/Admin.module.css";
import AuthLoadingOverlay from "../components/AuthLoadingOverlay";

function Admin() {
  const navigate = useNavigate();
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

  const fetchDatasets = async () => {
    setDatasetsLoading(true);
    try {
      const response = await axiosPublic.get("/v1/admin/datasets", { withCredentials: true });
      if (response.data.success) {
        const summary = response.data.data;
        const formattedDatasets = Object.entries(summary).map(([course, data]) => ({
          name: `${course}Exercises.json`,
          course,
          total: data.total,
          published: data.published,
          draft: data.draft,
          status: data.draft > 0 ? "draft" : "published",
          updatedAt: new Date(data.lastUpdated).toLocaleDateString()
        }));
        setDatasets(formattedDatasets);
      }
    } catch (error) {
      console.error("Error fetching datasets:", error);
      // Fallback to demo data on error
      setDatasets([
        { name: "pythonExercises.json", status: "draft", updatedAt: "Today" },
        { name: "cppExercises.json", status: "published", updatedAt: "Yesterday" },
        { name: "jsExercises.json", status: "draft", updatedAt: "2 days ago" },
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
            setIsAdmin(false);
            setStatus("unauthenticated");
            return;
          }

          const allowed = p?.role === "admin";
          setIsAdmin(allowed);
          setStatus("ok");
          
          // Fetch datasets and analytics when admin is authenticated
          if (allowed && !cancelled) {
            // fetchDatasets();
            fetchMetrics();
            fetchQuizMetrics();
            fetchUserQuizSummary();
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

        <p className={styles.subtitle}>Simple dashboard (demo values for now).</p>

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
              {demo.courseStarts.map((c) => (
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
            <h2 className={styles.title}>Exam Analytics & Statistics</h2>
          </div>
        </div>

        <p className={styles.subtitle}>Real user quiz attempts from backend.</p>

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
            <button className={styles.button} type="button" onClick={fetchQuizMetrics} disabled={quizMetricsLoading}>
              Refresh Quiz Data
            </button>
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
                {(quizMetrics?.attempts || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.quizEmpty}>No quiz attempts found.</td>
                  </tr>
                ) : (
                  (quizMetrics?.attempts || []).map((attempt) => (
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
              <button className={styles.button} type="button" onClick={fetchUserQuizSummary} disabled={userQuizSummaryLoading}>
                Refresh Users
              </button>
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


        <div className={styles.header} style={{ marginTop: 18 }}>
          <div className={styles.headerLeft}>
            <Database className={styles.icon} />
            <h2 className={styles.title}>Datasets</h2>
          </div>
          <button className={styles.button} type="button" onClick={() => alert("Next: Create dataset")}>Create Dataset</button>
        </div>

        <p className={styles.subtitle}>Manage course exercise datasets.</p>

        {datasetsLoading ? (
          <div className={styles.panel}>
            <p>Loading datasets...</p>
          </div>
        ) : (
          <div className={styles.panel}>
            <div className={styles.divider} style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              {datasets.length === 0 ? (
                <p>No datasets found. Create your first exercise dataset!</p>
              ) : (
                datasets.map((d) => (
                  <div key={d.name} className={styles.datasetRow}>
                    <div className={styles.datasetLeft}>
                      <div className={styles.datasetName}>{d.name}</div>
                      <div className={styles.datasetMeta}>
                        {d.total} exercises · {d.published} published · {d.draft} draft · Updated: {d.updatedAt}
                      </div>
                    </div>
                    <div className={styles.datasetActions}>
                      <button className={styles.button} type="button" onClick={() => navigate(`/admin/exercises/${d.course}`)}>Manage</button>
                      <button className={styles.button} type="button" onClick={() => alert(`Edit ${d.name}`)}>Edit</button>
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
