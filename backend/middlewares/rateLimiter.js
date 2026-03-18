import rateLimit from "express-rate-limit";

export function globalLimiter() {
  return rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100, // more realistic global limit
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    },
  });
}

export function authLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 8,

    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,

    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many login attempts. Try again in 1 minute.",
      });
    },
  });
}