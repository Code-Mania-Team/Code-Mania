// server.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config.js";

import v1 from "./routes/v1/index.js";
import "./core/supabaseClient.js";
import "./core/oauthSetup.js";

const app = express();
const port = process.env.PORT || 3000;

/* ---------------------------------
   Railway Proxy Support
----------------------------------- */
app.set("trust proxy", 1);

/* ---------------------------------
   Allowed Origins
----------------------------------- */
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:4173",
  "https://codemania.fun",
  "https://www.codemania.fun",
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "apikey"
  ],
};

/* ---------------------------------
   Middleware
----------------------------------- */
app.disable("etag");

app.use(morgan("combined"));
app.use(cookieParser());
app.set("trust-proxy", 1);
// app.use(globalLimiter());

app.use(cors(corsOptions));

app.use(
  cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:4173', 'https://codemania.fun'],
    credentials: true,
  })
);

app.options('*', cors()); // Enable pre-flight across-the-board

// ✅ Use built-in Express body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------------------------
   Routes
----------------------------------- */
app.use("/v1", v1);

/* ---------------------------------
   Health Check
----------------------------------- */
app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully!" });
});

/* ---------------------------------
   Cookie Debug Routes
----------------------------------- */
app.get("/set-cookies", (req, res) => {
  res.cookie("testCookie", "SweetCookies", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".codemania.fun",
  });

  res.send("Successfully set cookies");
});

app.get("/get-cookies", (req, res) => {
  res.send(req.cookies);
});

/* ---------------------------------
   Start Server
----------------------------------- */
app.listen(port, () => {
});
