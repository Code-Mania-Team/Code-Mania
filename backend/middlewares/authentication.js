import {supabase} from '../core/supabaseClient.js';

export const authentication = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: error.message });

  req.user = data.user;
  next();
};
export default authentication;