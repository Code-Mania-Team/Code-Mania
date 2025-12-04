import { WebSocketServer } from "ws";
import { spawn } from "child_process";

export function startTerminalSocketServer(server) {
  const wss =new WebSocketServer({ server, path: "/ws" })

  console.log("🔥 WebSocket Terminal server running");

  wss.on("connection", (ws) => {
    console.log("Client connected!");

    let shell = null;

    const startShell = (language = "python") => {
      if (shell) shell.kill();

      switch (language) {
        case "python":
          shell = spawn("docker", ["run", "--rm", "-i", "python:3.11", "python3", "-i", "-q"]);
          break;
        case "cpp":
          shell = spawn("docker", ["run", "--rm", "-i", "gcc:13", "bash"]);
          ws.send("⚠️ C++ interactive not fully supported, will run after compilation\n");
          break;
        case "js":
          shell = spawn("docker", ["run", "--rm", "-i", "node:20", "node", "-i"]);
          break;
        default:
          shell = spawn("docker", ["run", "--rm", "-i", "python:3.11", "python3", "-i"]);
      }

      shell.stdout.on("data", (data) => {
        ws.send(data.toString());
      });

      shell.stderr.on("data", (data) => {
        ws.send(data.toString());
      });

      shell.on("close", () => {
        console.log("Shell process closed");
      });
    };

    // start default shell
    startShell("python");

    ws.on("message", (msg) => {
      let data;
      try { data = JSON.parse(msg); } catch { return; }

      if (data.type === "code") {
        if (!shell) startShell(data.language || "python");
        shell.stdin.write(data.code + "\n");
      }

      if (data.type === "input") {
        if (shell) shell.stdin.write(data.value + "\n");
      }

      if (data.type === "language") {
        startShell(data.language);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      if (shell) shell.kill();
    });
  });
}
