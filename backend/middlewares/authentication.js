import jwt from "jsonwebtoken";

export default function authentication(req, res, next) {
  const token =
    req.cookies.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthenticated user",
    });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // ✅ Only assign user_id if exists
    if (decoded.user_id) {
      res.locals.user_id = decoded.user_id;
    }

        // ✅ Only assign user_id if exists
        if (decoded.user_id) {
            res.locals.user_id = decoded.user_id;
        }

        // ✅ Assign email for onboarding users
        if (decoded.email) {
            res.locals.email = decoded.email;
        }


        req.user = decoded;
        res.locals.user_id = decoded.user_id;
        res.locals.username = decoded.username;
        res.locals.role = decoded.role;
        next();
    });

    // ✅ Assign email for onboarding users
    if (decoded.email) {
      res.locals.email = decoded.email;
    }

    req.user = decoded;
    res.locals.user_id = decoded.user_id;
    res.locals.username = decoded.username;
    res.locals.role = decoded.role;
    next();
  });
}

export { authentication };

