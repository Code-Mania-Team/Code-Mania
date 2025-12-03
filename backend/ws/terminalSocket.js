import { WebSocketServer } from "ws";
import { spawn } from "child_process";

export function startTerminalSocketServer() {
  const wss = new WebSocketServer({ port: 3001 });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    // Spawn interactive Python inside Docker
    const python = spawn("docker", [
      "run",
      "--rm",
      "-i",
      "python:3.11",
      "python",
      "-i",
      "-u",
      "-q"
    ]);

    // Send Python stdout to frontend
    python.stdout.on("data", (data) => {
      ws.send(data.toString());
    });

    // Send Python stderr to frontend
    python.stderr.on("data", (data) => {
      ws.send(data.toString());
    });

    // Receive input from frontend and write to Python stdin
    ws.on("message", (msg) => {
      python.stdin.write(msg + "\n");
    });

    ws.on("close", () => {
      python.kill();
      console.log("Client disconnected");
    });
  });
}
