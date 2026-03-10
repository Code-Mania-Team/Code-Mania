import express from "express";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
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

// Required when behind Railway proxy
app.set("trust proxy", 1);
app.disable("etag");

/* ---------------------------------
   Middleware
----------------------------------- */

app.use(morgan("combined"));
app.use(cookieParser());

/* ---------------------------------
   Allowed Origins
----------------------------------- */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173",
];

/* ---------------------------------
   CORS Setup
----------------------------------- */

app.use(
  cors({
    origin: (origin, callback) => {
      // allow Postman / curl
      if (!origin) return callback(null, true);

      // allow listed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // allow subdomains like *.codemania.fun
      if (origin.endsWith(".codemania.fun")) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

/* ---------------------------------
   Body Parsing
----------------------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------------------------
   API Routes
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
  res.cookie("Set-cookie", "SweetCookies", {
    httpOnly: true,
    secure: true,        // required for HTTPS
    sameSite: "none",    // required for cross-domain cookies
  });

  res.send("Successfully set cookies");
});

app.get("/get-cookies", (req, res) => {
  res.json(req.cookies);
});

/* ---------------------------------
   Error Handler
----------------------------------- */

app.use((err, req, res, next) => {
  console.error(err.message);

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