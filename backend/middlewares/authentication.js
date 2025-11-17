import jwt from 'jsonwebtoken';

export function authentication(req, res, next) {
  let token = null;

  // 1. Authorization: Bearer <token>
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length);
  }

  // 2. query parameter ?token=
  if (!token && req.query?.token) {
    token = req.query.token;
  }

  // 3. cookie token
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  // 4. token header
  if (!token && req.headers?.token) {
    token = req.headers.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.API_SECRET_KEY);
    req.user = decoded; // { id, email }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
