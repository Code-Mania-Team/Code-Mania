import { spawn } from "child_process";

const sessions = {};

export function createSession(sessionId, language) {
  if (sessions[sessionId] && sessions[sessionId][language]) {
    return sessions[sessionId][language];
  }

  let process;
  switch(language) {
    case "python":
      process = spawn("python", ["-i"], { stdio: ["pipe", "pipe", "pipe"] });
      break;
    case "javascript":
      process = spawn("node", ["-i"], { stdio: ["pipe", "pipe", "pipe"] });
      break;
    case "cpp":
      process = spawn("cling", { stdio: ["pipe", "pipe", "pipe"] }); // cling must be installed
      break;
    default:
      throw new Error("Unsupported language");
  }

  if (!sessions[sessionId]) sessions[sessionId] = {};
  sessions[sessionId][language] = process;

  return process;
}

export function destroySession(sessionId) {
  if (sessions[sessionId]) {
    Object.values(sessions[sessionId]).forEach(proc => proc.kill());
    delete sessions[sessionId];
  }
}
