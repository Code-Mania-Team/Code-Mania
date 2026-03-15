import jwt from "jsonwebtoken";

export default function optionalAuthentication(req, res, next) {
  const token =
    req.cookies.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // Treat invalid tokens as guest for optional routes.
      return next();
    }

    if (decoded?.user_id) {
      res.locals.user_id = decoded.user_id;
    }
    if (decoded?.email) {
      res.locals.email = decoded.email;
    }

    req.user = decoded;
    res.locals.username = decoded?.username;
    res.locals.role = decoded?.role;
    return next();
  });
}

export { optionalAuthentication };
