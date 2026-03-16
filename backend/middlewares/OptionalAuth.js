import jwt from "jsonwebtoken";

// Best-effort auth: attach user context when token is valid, but allow guests.
// Important: If token is missing/invalid/expired, DO NOT 401.
const attachUserIfValid = (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) return next();

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err || !decoded) return next();

    req.user = decoded;
    res.locals.user_id = decoded.user_id;
    res.locals.username = decoded.username;
    res.locals.role = decoded.role;
    if (decoded.email) res.locals.email = decoded.email;
    next();
  });
}

export { attachUserIfValid };