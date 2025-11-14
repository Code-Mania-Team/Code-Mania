// models/user.js
import { supabase } from '../core/supabaseClient.js';

class UserController {
  // Check if a user exists by user_id
  async getById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, username')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  // Create a new user if not exists
  async createIfNotExists(user) {
    const existing = await this.getById(user.id);
    if (!existing) {
      const { error } = await supabase.from('users').insert({
        user_id: user.id,
        email: user.email,
      });
      if (error) throw error;
      return { user_id: user.id, email: user.email };
    }
    return existing;
  }

  // Delete a user
  async delete(userId) {
    const { error } = await supabase.from('users').delete().eq('user_id', userId);
    if (error) throw error;
    return true;
  }

  // Set username
  async setUsername(userId, username) {
    const { data, error } = await supabase
      .from('users')
      .update({ username })
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}

export default UserController;
