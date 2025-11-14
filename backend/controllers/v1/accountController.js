import { supabase } from '../../core/supabaseClient.js';
import jwt from 'jsonwebtoken';
import UserController from '../../models/user.js';

const userController = new UserController();

class AccountController {
  async sendMagicLink(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'http://localhost:5173/dashboard',
        },
      });

      if (error) {
        if (error.status === 429) {
          return res.status(429).json({ success: false, message: 'Too many magic link requests. Please try again later.' });
        }
        throw error;
      }

      res.json({ success: true, message: 'Magic link sent! Check your email.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async verifyMagicLink(req, res) {
    try {
      const token = req.body?.token || req.query?.token;
      if (!token) return res.status(400).json({ success: false, message: 'Missing access token' });

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) return res.status(401).json({ success: false, message: 'Invalid or expired token' });

      const user = data.user;

      // ✅ Ensure user exists in users table
      await userController.createIfNotExists(user);

      // Create backend JWT
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.API_SECRET_KEY,
        { expiresIn: '1h' }
      );

      if (req.method === 'POST') {
        return res.json({ success: true, message: 'Verified', token: jwtToken });
      }

      const redirectTo = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${redirectTo}/dashboard?token=${encodeURIComponent(jwtToken)}`);
    } catch (err) {
      console.error('verifyMagicLink error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async deleteUser(req, res) {
    try {
      const userId = req.user.id;
      await userController.delete(userId);
      await supabase.auth.admin.deleteUser(userId);

      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async setUsername(req, res) {
    try {
      const userId = req.user.id;
      const { username } = req.body;
      const data = await userController.setUsername(userId, username);
      res.json({ success: true, user: data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const data = await userController.getById(userId);
      if (!data) return res.status(404).json({ success: false, message: 'User not found' });

      return res.json({ success: true, user: data });
    } catch (err) {
      console.error('getProfile error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

export default AccountController;
