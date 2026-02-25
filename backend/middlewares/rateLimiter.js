import rateLimit from "express-rate-limit";

export function globalLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    // legeacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: "error",
        message: "Rate limit exceeded",
      });
    },
  });
}

export function authLimiter() {
  return rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    handler: (req, res) => {
      res.status(429).json({
        status: "error",
        message: "Too many login attemps.",
      });
    },
  });
}
