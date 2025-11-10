// controllers/accountController.js
import { supabase } from '../../core/supabaseClient.js';
import jwt from 'jsonwebtoken';

class AccountController {
  

  /* ---------------------------------
     Magic Link (Send Login Email)
  ----------------------------------- */
  async sendMagicLink(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).send({ success: false, message: 'Email is required' });

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'http://localhost:5173/dashboard',
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

  

}

export default AccountController;
