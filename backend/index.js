import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";

import v1 from "./routes/v1/index.js";
import "./core/supabaseClient.js";
import "./core/oauthSetup.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";

const app = express();
const port = process.env.PORT || 3000;

/* ---------------------------------
   Express Settings
----------------------------------- */

app.set("trust proxy", 1); // required for Railway proxy
app.disable("etag");

/* ---------------------------------
   Middleware
----------------------------------- */

app.use(morgan("combined"));
app.use(cookieParser());

/* ---------------------------------
   CORS Setup
----------------------------------- */

app.use(
  cors({
    origin: true, // automatically reflect request origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ---------------------------------
   Body Parsing
----------------------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------------------------
   Rate Limiter + API Routes
----------------------------------- */

app.use("/v1", globalLimiter(), v1);

/* ---------------------------------
   Health Check
----------------------------------- */

app.get("/", (req, res) => {
  res.json({
    message: "Backend is running successfully!",
  });
});

/* ---------------------------------
   Cookie Test Routes
----------------------------------- */

app.get("/set-cookies", (req, res) => {
  res.cookie("codemania_cookie", "SweetCookies", {
    httpOnly: true,
    secure: true,       // required for HTTPS
    sameSite: "none",   // required for cross-domain
  });

  res.send("Cookie set successfully");
});

app.get("/get-cookies", (req, res) => {
  res.json(req.cookies);
});

/* ---------------------------------
   Global Error Handler
----------------------------------- */

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  res.status(500).json({
    error: err.message,
  });
});

/* ---------------------------------
   Start Server
----------------------------------- */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});