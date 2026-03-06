import rateLimit from "express-rate-limit";


export function authLimiter() {
  return rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    handler: (req, res) => {
      res.status(429).json({
        status: "error",
        message: "Too many login attempts.",
      });
    },
  });
}