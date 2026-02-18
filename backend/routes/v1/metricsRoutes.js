import { Router } from 'express';
import { authorization } from '../../middlewares/authorization.js';
import { supabase } from '../../core/supabaseClient.js';

const router = Router();

router.use(authorization);

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

    // Interpreting "Total Courses Started" as unique (user_id, programming_language) pairs recorded in users_game_data
    // This is best-effort: if the table/columns don't exist or RLS blocks it, we still return user counts.
    let totalCoursesStarted = 0;
    const { data: courseStartsRows, error: courseStartsError } = await supabase
      .from('users_game_data')
      .select('user_id, programming_language');

    if (courseStartsError) {
      console.error('metrics admin-summary: users_game_data query failed:', courseStartsError);
    } else {
      totalCoursesStarted = new Set(
        (courseStartsRows || [])
          .filter((r) => r?.user_id != null && r?.programming_language)
          .map((r) => `${r.user_id}:${r.programming_language}`)
      ).size;
    }

    return res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        newUsers7d: newUsers7d || 0,
        newUsers30d: newUsers30d || 0,
        newUsers365d: newUsers365d || 0,
        totalCoursesStarted: totalCoursesStarted || 0,
        signupsPerDay,
      },
    });
  } catch (err) {
    console.error('Error building admin summary metrics:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to build metrics' });
  }
});

export default router;
