import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosPublic } from "../api/axios";
import useAuth from "../hooks/useAxios";
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

  const demo = {
    totalUsers: 92,
    newUsers7d: 7,
    activeUsers7d: 18,
    totalCoursesStarted: 41,
    signupsPerDay: [
      { day: "Mon", count: 1 },
      { day: "Tue", count: 0 },
      { day: "Wed", count: 2 },
      { day: "Thu", count: 1 },
      { day: "Fri", count: 3 },
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
            fetchDatasets();
            fetchAnalytics();
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
          <button className={styles.button} type="button" onClick={() => navigate("/")}>Back to site</button>
        </div>

        <p className={styles.subtitle}>Simple dashboard (demo values for now).</p>

        <div className={styles.grid}>
          <StatCard title="Total Users" value={demo.totalUsers} subtitle="Demo numbers" />
          <StatCard title="New Users (7 days)" value={demo.newUsers7d} subtitle="Demo numbers" />
          <StatCard title="Active Users (7 days)" value={demo.activeUsers7d} subtitle="Demo numbers" />
          <StatCard title="Total Courses Started" value={demo.totalCoursesStarted} subtitle="Demo numbers" />
        </div>

        <div className={styles.panels}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Users Overview</h3>
            <p className={styles.panelSubtitle}>Signups per day</p>
            <div className={styles.divider}>
              {demo.signupsPerDay.map((d) => (
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

        <p className={styles.subtitle}>Real-time exam performance data and statistical analysis.</p>

        {analyticsLoading ? (
          <div className={styles.panel}>
            <p>Loading analytics...</p>
          </div>
        ) : analytics ? (
          <>
            <div className={styles.grid}>
              <StatCard title="Total Exams Taken" value={analytics.total_exams_taken} subtitle="Completed exams" />
              <StatCard title="Mean Exam Grade" value={`${analytics.mean_exam_grade.toFixed(1)}%`} subtitle="Average score across all users" />
              <StatCard title="Median Exam Grade" value={`${analytics.median_exam_grade.toFixed(1)}%`} subtitle="Middle value of exam scores" />
              <StatCard title="Mode Retake Count" value={analytics.mode_retake_count} subtitle="Most common retake number" />
            </div>

            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Student Exam Performance</h3>
              <p className={styles.panelSubtitle}>Individual student exam results and performance metrics</p>
              <div className={styles.divider}>
                {analytics.user_exam_data.map((user) => (
                  <div key={user.user_id} className={styles.datasetRow}>
                    <div className={styles.datasetLeft}>
                      <div className={styles.datasetName}>{user.email}</div>
                      <div className={styles.datasetMeta}>
                        {user.programming_language.toUpperCase()} • 
                        Grade: {user.final_exam_grade}% • 
                        Retakes: {user.retake_count}
                      </div>
                      <div className={styles.datasetMeta} style={{ fontSize: '12px', opacity: 0.7 }}>
                        Started: {new Date(user.exam_activated_date).toLocaleDateString()} • 
                        {user.exam_close_date ? 
                          ` Completed: ${new Date(user.exam_close_date).toLocaleDateString()} (${user.exam_duration_minutes}min)` : 
                          ' In Progress'
                        }
                      </div>
                    </div>
                    <div className={styles.datasetActions}>
                      <button className={styles.button} type="button">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Daily Exam Completions</h3>
              <p className={styles.panelSubtitle}>Exam completion rates and average grades per day</p>
              <div className={styles.divider}>
                {analytics.daily_exam_completions.map((day) => (
                  <div key={day.date} className={styles.row}>
                    <div className={styles.day}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div className={styles.track}>
                      <div className={styles.fill} style={{ width: `${Math.min(100, day.exams_completed * 50)}%` }} />
                    </div>
                    <div className={styles.count}>{day.exams_completed} exams</div>
                    <div style={{ marginLeft: '10px', fontSize: '12px', opacity: 0.7 }}>
                      {day.avg_grade > 0 ? `${day.avg_grade.toFixed(1)}% avg` : 'No exams'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.panel}>
            <p>Failed to load analytics data.</p>
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
