import rateLimit from "express-rate-limit";

export function authLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 8, // 8 requests per minute

    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again in 1 minute.",
      });
    },
  });
}