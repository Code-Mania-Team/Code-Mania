// controllers/v1/userController.js
import { supabase } from '../../core/supabaseClient.js';

class UserController {
  /* 🧠 Get all users */
  async getAllUsers(req, res) {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;

      res.status(200).json({ success: true, users: data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /* 👤 Get single user by ID */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      res.status(200).json({ success: true, user: data });
    } catch (err) {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  }

  /* ✏️ Update user profile */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      res.status(200).json({ success: true, message: 'User updated', user: data[0] });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /* ❌ Delete user */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) throw error;
      res.status(200).json({ success: true, message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export default UserController;
