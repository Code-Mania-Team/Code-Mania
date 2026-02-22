import { Router } from 'express';
import { authentication } from '../../middlewares/authentication.js';
import { authorization } from '../../middlewares/authorization.js';
import { requireAdmin } from '../../middlewares/requireAdmin.js';
import User from '../../models/user.js';

const router = Router();
const userModel = new User();

router.use(authorization);

router.get('/users', authentication, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await userModel.db
      .from('users')
      .select('user_id, email, username, full_name, profile_image, character_id, created_at, role')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

export default router;
