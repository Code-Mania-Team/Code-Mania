import { Router } from 'express';
import { authorization } from '../../middlewares/authorization.js';
import { authentication } from '../../middlewares/authentication.js';
import requireAdmin from '../../middlewares/requireAdmin.js';
import { supabase } from '../../core/supabaseClient.js';

const router = Router();

router.use(authorization);

const mapQuizAttempt = (row) => {
  const language = row?.quizzes?.programming_languages?.slug || 'unknown';
  const score = Number(row?.score_percentage || 0);

  return {
    id: row.id,
    userId: row.user_id,
    username: row?.users?.username || row?.users?.full_name || 'Unknown user',
    email: row?.users?.email || '',
    language,
    quizTitle: row?.quizzes?.quiz_title || row?.quizzes?.route || 'Quiz',
    scorePercentage: score,
    totalCorrect: row?.total_correct || 0,
    totalQuestions: row?.total_questions || 0,
    earnedXp: row?.earned_xp || 0,
    isPassed: score >= 70,
    submittedAt: row?.completed_at || null,
  };
};

// Public-ish (API key protected) metrics for admin dashboard cards
router.get('/admin-summary', async (req, res) => {
  try {
    const now = Date.now();
    const sevenDaysAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgoIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const oneYearAgoIso = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();

    const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const signupsPerDayMap = new Map(dayKeys.map((k) => [k, 0]));

    const { count: totalUsers, error: totalUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalUsersError) {
      return res.status(500).json({ success: false, message: totalUsersError.message });
    }

    const { count: newUsers7d, error: newUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgoIso);

    if (newUsersError) {
      return res.status(500).json({ success: false, message: newUsersError.message });
    }

    // Signups per day (last 7 days) - best effort
    const { data: signupsRows, error: signupsRowsError } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', sevenDaysAgoIso);

    if (signupsRowsError) {
      console.error('metrics admin-summary: signups rows query failed:', signupsRowsError);
    } else {
      (signupsRows || []).forEach((row) => {
        const createdAt = row?.created_at;
        if (!createdAt) return;
        const d = new Date(createdAt);
        if (Number.isNaN(d.getTime())) return;
        const key = dayKeys[(d.getDay() + 6) % 7]; // JS: 0=Sun; map to Mon..Sun
        signupsPerDayMap.set(key, (signupsPerDayMap.get(key) || 0) + 1);
      });
    }

    const signupsPerDay = dayKeys.map((day) => ({ day, count: signupsPerDayMap.get(day) || 0 }));

    const { count: newUsers30d, error: newUsers30dError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgoIso);

    if (newUsers30dError) {
      return res.status(500).json({ success: false, message: newUsers30dError.message });
    }

    const { count: newUsers365d, error: newUsers365dError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneYearAgoIso);

    if (newUsers365dError) {
      return res.status(500).json({ success: false, message: newUsers365dError.message });
    }

    // Interpreting "Total Courses Started" as unique (user_id, language) pairs recorded in users_game_data.
    // Also return per-course breakdown for admin UI.
    let totalCoursesStarted = 0;
    const courseStartsMap = new Map([
      ['Python', 0],
      ['JavaScript', 0],
      ['C++', 0],
    ]);

    const normalizeLanguageName = (raw) => {
      const value = String(raw || '').trim().toLowerCase();
      if (value === 'python' || value === '1') return 'Python';
      if (value === 'javascript' || value === 'js' || value === '3') return 'JavaScript';
      if (value === 'cpp' || value === 'c++' || value === '2') return 'C++';
      return null;
    };

    const { data: courseStartsRows, error: courseStartsError } = await supabase
      .from('users_game_data')
      .select(`
        user_id,
        programming_language,
        quests (
          programming_languages (
            name,
            slug
          )
        )
      `);

    if (courseStartsError) {
      console.error('metrics admin-summary: users_game_data query failed:', courseStartsError);
    } else {
      const uniqueStarts = new Set();

      (courseStartsRows || []).forEach((row) => {
        const joinedLanguage = row?.quests?.programming_languages?.name || row?.quests?.programming_languages?.slug;
        const directLanguage = row?.programming_language;
        const normalized = normalizeLanguageName(joinedLanguage || directLanguage);

        if (row?.user_id == null || !normalized) return;

        const pairKey = `${row.user_id}:${normalized}`;
        if (uniqueStarts.has(pairKey)) return;

        uniqueStarts.add(pairKey);
        courseStartsMap.set(normalized, (courseStartsMap.get(normalized) || 0) + 1);
      });

      totalCoursesStarted = uniqueStarts.size;
    }

    const courseStarts = [
      { name: 'Python', started: courseStartsMap.get('Python') || 0 },
      { name: 'JavaScript', started: courseStartsMap.get('JavaScript') || 0 },
      { name: 'C++', started: courseStartsMap.get('C++') || 0 },
    ];

    return res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        newUsers7d: newUsers7d || 0,
        newUsers30d: newUsers30d || 0,
        newUsers365d: newUsers365d || 0,
        totalCoursesStarted: totalCoursesStarted || 0,
        courseStarts,
        signupsPerDay,
      },
    });
  } catch (err) {
    console.error('Error building admin summary metrics:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to build metrics' });
  }
});

router.get('/quiz-attempts', authentication, requireAdmin, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('user_quiz_attempts')
      .select(`
        id,
        user_id,
        score_percentage,
        total_correct,
        total_questions,
        earned_xp,
        completed_at,
        users (
          username,
          full_name,
          email
        ),
        quizzes (
          quiz_title,
          route,
          programming_languages (
            slug
          )
        )
      `)
      .order('completed_at', { ascending: false })
      .limit(200);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const attempts = (rows || []).map(mapQuizAttempt);

    const totalAttempts = attempts.length;
    const totalXpAwarded = attempts.reduce((sum, item) => sum + Number(item.earnedXp || 0), 0);
    const averageScore = totalAttempts
      ? Number((attempts.reduce((sum, item) => sum + Number(item.scorePercentage || 0), 0) / totalAttempts).toFixed(2))
      : 0;
    const passedCount = attempts.filter((item) => item.isPassed).length;
    const passRate = totalAttempts ? Number(((passedCount / totalAttempts) * 100).toFixed(2)) : 0;

    return res.json({
      success: true,
      data: {
        totalAttempts,
        averageScore,
        passRate,
        totalXpAwarded,
        attempts,
      },
    });
  } catch (err) {
    console.error('Error fetching quiz attempts metrics:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch quiz metrics' });
  }
});

router.get('/quiz-attempts/by-user', authentication, requireAdmin, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('user_quiz_attempts')
      .select(`
        id,
        user_id,
        score_percentage,
        total_correct,
        total_questions,
        earned_xp,
        completed_at,
        users (
          username,
          full_name,
          email
        ),
        quizzes (
          quiz_title,
          route,
          programming_languages (
            slug
          )
        )
      `)
      .order('completed_at', { ascending: false })
      .limit(2000);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const attempts = (rows || []).map(mapQuizAttempt);
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
          latestAttemptAt: attempt.submittedAt,
          languagesSet: new Set([attempt.language]),
        });
        return;
      }

      existing.totalAttempts += 1;
      existing.sumScore += Number(attempt.scorePercentage || 0);
      existing.passedCount += attempt.isPassed ? 1 : 0;
      existing.bestScore = Math.max(existing.bestScore, Number(attempt.scorePercentage || 0));
      if (!existing.latestAttemptAt || new Date(attempt.submittedAt) > new Date(existing.latestAttemptAt)) {
        existing.latestAttemptAt = attempt.submittedAt;
      }
      existing.languagesSet.add(attempt.language);
    });

    const users = Array.from(byUserMap.values())
      .map((item) => ({
        userId: item.userId,
        username: item.username,
        email: item.email,
        totalAttempts: item.totalAttempts,
        averageScore: Number((item.sumScore / item.totalAttempts).toFixed(2)),
        passRate: Number(((item.passedCount / item.totalAttempts) * 100).toFixed(2)),
        bestScore: item.bestScore,
        latestAttemptAt: item.latestAttemptAt,
        languages: Array.from(item.languagesSet),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.latestAttemptAt || 0).getTime();
        const dateB = new Date(b.latestAttemptAt || 0).getTime();
        return dateB - dateA;
      });

    return res.json({
      success: true,
      data: {
        totalUsers: users.length,
        users,
      },
    });
  } catch (err) {
    console.error('Error fetching per-user quiz metrics:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch per-user quiz metrics' });
  }
});

router.get('/quiz-attempts/by-user/:userId', authentication, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: rows, error } = await supabase
      .from('user_quiz_attempts')
      .select(`
        id,
        user_id,
        score_percentage,
        total_correct,
        total_questions,
        earned_xp,
        completed_at,
        users (
          username,
          full_name,
          email
        ),
        quizzes (
          quiz_title,
          route,
          programming_languages (
            slug
          )
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(500);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const attempts = (rows || []).map(mapQuizAttempt);

    return res.json({
      success: true,
      data: {
        userId,
        totalAttempts: attempts.length,
        attempts,
      },
    });
  } catch (err) {
    console.error('Error fetching user quiz attempts:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch user quiz attempts' });
  }
});

export default router;
