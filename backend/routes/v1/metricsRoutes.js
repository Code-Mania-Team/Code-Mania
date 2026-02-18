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
        totalCoursesStarted: totalCoursesStarted || 0,
      },
    });
  } catch (err) {
    console.error('Error building admin summary metrics:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to build metrics' });
  }
});

export default router;
