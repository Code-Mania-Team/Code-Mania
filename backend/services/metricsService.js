import MetricsModel from "../models/metrics.js";

class MetricsService {
  constructor(model = new MetricsModel()) {
    this.model = model;
  }

  mapQuizAttempt(row) {
    const language = row?.quizzes?.programming_languages?.slug || "unknown";
    const score = Number(row?.score_percentage || 0);

    return {
      id: row.id,
      userId: row.user_id,
      username: row?.users?.username || row?.users?.full_name || "Unknown user",
      email: row?.users?.email || "",
      language,
      quizTitle: row?.quizzes?.quiz_title || row?.quizzes?.route || "Quiz",
      scorePercentage: score,
      totalCorrect: row?.total_correct || 0,
      totalQuestions: row?.total_questions || 0,
      earnedXp: row?.earned_xp || 0,
      isPassed: score >= 70,
      submittedAt: row?.completed_at || null,
    };
  }

  mapExamAttempt(row) {
    const language = row?.exam_problems?.programming_languages?.slug || row?.language || "unknown";
    const score = Number(row?.score_percentage || 0);

    return {
      id: row.id,
      userId: row.user_id,
      username: row?.users?.username || row?.users?.full_name || "Unknown user",
      email: row?.users?.email || "",
      language,
      examTitle: row?.exam_problems?.problem_title || "Exam",
      scorePercentage: score,
      attemptNumber: Number(row?.attempt_number || 0),
      earnedXp: Number(row?.earned_xp || 0),
      isPassed: Boolean(row?.passed),
      submittedAt: row?.created_at || null,
    };
  }

  summarizeAttempts(attempts) {
    const totalAttempts = attempts.length;
    const totalXpAwarded = attempts.reduce((sum, item) => sum + Number(item.earnedXp || 0), 0);
    const averageScore = totalAttempts
      ? Number((attempts.reduce((sum, item) => sum + Number(item.scorePercentage || 0), 0) / totalAttempts).toFixed(2))
      : 0;
    const passedCount = attempts.filter((item) => item.isPassed).length;
    const passRate = totalAttempts ? Number(((passedCount / totalAttempts) * 100).toFixed(2)) : 0;

    return {
      totalAttempts,
      averageScore,
      passRate,
      totalXpAwarded,
      attempts,
    };
  }

  summarizeAttemptsByUser(attempts, includeTotalXp = false) {
    const byUserMap = new Map();

    attempts.forEach((attempt) => {
      const key = String(attempt.userId);
      const existing = byUserMap.get(key);

      if (!existing) {
        byUserMap.set(key, {
          userId: attempt.userId,
          username: attempt.username,
          email: attempt.email,
          totalAttempts: 1,
          sumScore: Number(attempt.scorePercentage || 0),
          passedCount: attempt.isPassed ? 1 : 0,
          bestScore: Number(attempt.scorePercentage || 0),
          totalXpAwarded: Number(attempt.earnedXp || 0),
          latestAttemptAt: attempt.submittedAt,
          languagesSet: new Set([attempt.language]),
        });
        return;
      }

      existing.totalAttempts += 1;
      existing.sumScore += Number(attempt.scorePercentage || 0);
      existing.passedCount += attempt.isPassed ? 1 : 0;
      existing.bestScore = Math.max(existing.bestScore, Number(attempt.scorePercentage || 0));
      existing.totalXpAwarded += Number(attempt.earnedXp || 0);
      if (!existing.latestAttemptAt || new Date(attempt.submittedAt) > new Date(existing.latestAttemptAt)) {
        existing.latestAttemptAt = attempt.submittedAt;
      }
      existing.languagesSet.add(attempt.language);
    });

    const users = Array.from(byUserMap.values())
      .map((item) => {
        const base = {
          userId: item.userId,
          username: item.username,
          email: item.email,
          totalAttempts: item.totalAttempts,
          averageScore: Number((item.sumScore / item.totalAttempts).toFixed(2)),
          passRate: Number(((item.passedCount / item.totalAttempts) * 100).toFixed(2)),
          bestScore: item.bestScore,
          latestAttemptAt: item.latestAttemptAt,
          languages: Array.from(item.languagesSet),
        };

        if (includeTotalXp) {
          base.totalXpAwarded = item.totalXpAwarded;
        }

        return base;
      })
      .sort((a, b) => {
        const dateA = new Date(a.latestAttemptAt || 0).getTime();
        const dateB = new Date(b.latestAttemptAt || 0).getTime();
        return dateB - dateA;
      });

    return {
      totalUsers: users.length,
      users,
    };
  }

  normalizeLanguageName(raw) {
    const value = String(raw || "").trim().toLowerCase();
    if (value === "python" || value === "1") return "Python";
    if (value === "javascript" || value === "js" || value === "3") return "JavaScript";
    if (value === "cpp" || value === "c++" || value === "2") return "C++";
    return null;
  }

  buildSignupsPerDay(rows) {
    const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const map = new Map(dayKeys.map((k) => [k, 0]));

    rows.forEach((row) => {
      const createdAt = row?.created_at;
      if (!createdAt) return;
      const d = new Date(createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = dayKeys[(d.getDay() + 6) % 7];
      map.set(key, (map.get(key) || 0) + 1);
    });

    return dayKeys.map((day) => ({ day, count: map.get(day) || 0 }));
  }

  buildCourseStarts(rows) {
    const courseStartsMap = new Map([
      ["Python", 0],
      ["JavaScript", 0],
      ["C++", 0],
    ]);
    const uniqueStarts = new Set();

    rows.forEach((row) => {
      const joinedLanguage = row?.quests?.programming_languages?.name || row?.quests?.programming_languages?.slug;
      const normalized = this.normalizeLanguageName(joinedLanguage);
      if (row?.user_id == null || !normalized) return;

      const pairKey = `${row.user_id}:${normalized}`;
      if (uniqueStarts.has(pairKey)) return;

      uniqueStarts.add(pairKey);
      courseStartsMap.set(normalized, (courseStartsMap.get(normalized) || 0) + 1);
    });

    return {
      totalCoursesStarted: uniqueStarts.size,
      courseStarts: [
        { name: "Python", started: courseStartsMap.get("Python") || 0 },
        { name: "JavaScript", started: courseStartsMap.get("JavaScript") || 0 },
        { name: "C++", started: courseStartsMap.get("C++") || 0 },
      ],
    };
  }

  async getAdminSummary() {
    const now = Date.now();
    const sevenDaysAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgoIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const oneYearAgoIso = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalUsers,
      newUsers7d,
      newUsers30d,
      newUsers365d,
      signupsRows,
      courseStartsRows,
    ] = await Promise.all([
      this.model.countUsersCreatedSince(),
      this.model.countUsersCreatedSince(sevenDaysAgoIso),
      this.model.countUsersCreatedSince(thirtyDaysAgoIso),
      this.model.countUsersCreatedSince(oneYearAgoIso),
      this.model.getUserSignupRowsSince(sevenDaysAgoIso),
      this.model.getCourseStartRows(),
    ]);

    const signupsPerDay = this.buildSignupsPerDay(signupsRows);
    const { totalCoursesStarted, courseStarts } = this.buildCourseStarts(courseStartsRows);

    return {
      totalUsers,
      newUsers7d,
      newUsers30d,
      newUsers365d,
      totalCoursesStarted,
      courseStarts,
      signupsPerDay,
    };
  }

  async getQuizAttemptsMetrics() {
    const rows = await this.model.getQuizAttempts({ limit: 200 });
    const attempts = rows.map((row) => this.mapQuizAttempt(row));
    return this.summarizeAttempts(attempts);
  }

  async getQuizAttemptsByUser() {
    const rows = await this.model.getQuizAttempts({ limit: 2000 });
    const attempts = rows.map((row) => this.mapQuizAttempt(row));
    return this.summarizeAttemptsByUser(attempts, false);
  }

  async getQuizAttemptsByUserId(userId) {
    const rows = await this.model.getQuizAttempts({ userId, limit: 500 });
    const attempts = rows.map((row) => this.mapQuizAttempt(row));
    return {
      userId,
      totalAttempts: attempts.length,
      attempts,
    };
  }

  async getExamAttemptsMetrics() {
    const rows = await this.model.getExamAttempts({ limit: 300 });
    const attempts = rows.map((row) => this.mapExamAttempt(row));
    return this.summarizeAttempts(attempts);
  }

  async getExamAttemptsByUser() {
    const rows = await this.model.getExamAttempts({ limit: 3000 });
    const attempts = rows.map((row) => this.mapExamAttempt(row));
    return this.summarizeAttemptsByUser(attempts, true);
  }

  async getExamAttemptsByUserId(userId) {
    const rows = await this.model.getExamAttempts({ userId, limit: 500 });
    const attempts = rows.map((row) => this.mapExamAttempt(row));
    return {
      userId,
      totalAttempts: attempts.length,
      attempts,
    };
  }
}

export default MetricsService;
