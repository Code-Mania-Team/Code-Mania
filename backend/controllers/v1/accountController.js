// controllers/accountController.js
import { supabase } from '../core/supabaseClient.js';
import jwt from 'jsonwebtoken';

class AccountController {
  constructor() {}

  /* ---------------------------------
     ✉️ Magic Link (Send Login Email)
  ----------------------------------- */
  async sendMagicLink(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).send({ success: false, message: 'Email is required' });

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: process.env.FRONTEND_URL + '/auth/callback',
        },
      });

      if (error) throw error;

      res.send({
        success: true,
        message: 'Magic link sent! Check your email.',
      });
    } catch (err) {
      res.send({
        success: false,
        message: err.message || 'Failed to send magic link',
      });
    }
  }

  /* ---------------------------------
     🔐 Verify Session Token (optional)
  ----------------------------------- */
  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).send({ success: false, message: 'No token provided' });

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) return res.status(401).send({ success: false, message: 'Invalid or expired token' });

      res.send({
        success: true,
        data: { user },
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.message,
      });
    }
  }

  /* ---------------------------------
     🧑 Google OAuth Sign-in (frontend)
     (for info: frontend handles popup)
  ----------------------------------- */
  async googleCallback(req, res) {
    try {
      const { access_token } = req.query;
      if (!access_token) return res.status(400).send({ success: false, message: 'No access token' });

      const { data: { user }, error } = await supabase.auth.getUser(access_token);
      if (error) throw error;

      // Optional: Create your own JWT for internal API protection
      const token = jwt.sign(
        { user_id: user.id, email: user.email },
        process.env.API_SECRET_KEY,
        { expiresIn: '1d' }
      );

      res.send({
        success: true,
        message: 'Google login successful',
        token,
        data: user,
      });
    } catch (err) {
      res.send({
        success: false,
        message: err.message,
      });
    }
  }

  /* ---------------------------------
     🧍 Profile (protected)
  ----------------------------------- */
  async profile(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).send({ success: false, message: 'No token provided' });

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).send({ success: false, message: 'Invalid token' });

      res.send({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || 'No name',
          avatar: user.user_metadata?.avatar_url || null,
        },
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.message,
      });
    }
  }
}

export default AccountController;
