import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import 'dotenv/config.js';
import v1 from "./routes/v1/index.js";
import "./core/supabaseClient.js";
import { startTerminalSocketServer } from "./ws/terminalSocket.js";

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/v1", v1);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend running successfully!" });
});

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket server
startTerminalSocketServer(server);

// Start server
server.listen(port, () => {
  console.log(`🚀 API + WS server running on http://localhost:${port}`);
});
