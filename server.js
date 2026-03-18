import express from "express";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { isDeepStrictEqual } from "util";

const app = express();
app.use(express.json());

const server = app.listen(8000, () => {
  console.log("✅ Server running on http://localhost:8000");
});

const wss = new WebSocketServer({ server });

/* ===============================
   PRESENCE (ONLINE USERS)
=============================== */

const presenceClients = new Set();

function safeJsonSend(ws, payload) {
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function getPresenceStats() {
  const connections = presenceClients.size;
  const userIds = new Set();

  for (const ws of presenceClients) {
    const id = ws.__presenceUserId;
    if (id) userIds.add(id);
  }

  return {
    connections,
    uniqueUsers: userIds.size,
  };
}

function broadcastPresence() {
  const stats = getPresenceStats();
  for (const client of presenceClients) {
    safeJsonSend(client, {
      type: "presence:update",
      ...stats,
    });
  }
}

const PRESENCE_PING_INTERVAL_MS = 30000;
setInterval(() => {
  for (const ws of presenceClients) {
    if (ws.__isAlive === false) {
      try {
        ws.terminate();
      } catch {
        // ignore
      }
      continue;
    }

    ws.__isAlive = false;
    try {
      ws.ping();
    } catch {
      // ignore
    }
  }
}, PRESENCE_PING_INTERVAL_MS);

const TMP_DIR = "/tmp/codemania";

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}


/* ===============================
   LANGUAGE CONFIG
=============================== */
const LANG_CONFIG = {
  python: {
    file: "main.py",
    image: "python:3.12-alpine",
    cmd: ["python3", "main.py"]
  },
  javascript: {
    file: "main.js",
    image: "node:20-alpine",
    cmd: ["node", "main.js"]
  },
  cpp: {
    file: "main.cpp",
    image: "gcc:13",
    cmd: [
      "sh",
      "-lc",
      "g++ main.cpp -O2 -o /tmp/main 2>&1 || exit 1 && /tmp/main"
    ]
  }
};

/* ===============================
   SANITIZATION
=============================== */

function stripComments(code, language) {
  if (language === "javascript" || language === "cpp") {
    code = code.replace(/\/\/.*$/gm, "");
    code = code.replace(/\/\*[\s\S]*?\*\//g, "");
  }

  if (language === "python") {
    code = code.replace(/#.*$/gm, "");
  }

  return code;
}

function sanitizePython(code) {
  // Defense-in-depth only. Docker sandboxing is the primary security boundary.
  const allowedTopLevelModules = new Set([
    "math",
    "itertools",
    "functools",
    "collections",
    "heapq",
    "bisect",
    "re",
    "string",
    "random",
    "statistics",
    "fractions",
    "decimal",
    "typing",
    "dataclasses",
    "json"
  ]);

  const blockedTopLevelModules = new Set([
    "os",
    "subprocess",
    "socket",
    "shutil",
    "pathlib",
    "importlib",
    "ctypes",
    "marshal",
    "pickle",
    "resource",
    "signal",
    "multiprocessing",
    "threading",
    "concurrent",
    "asyncio"
  ]);

  // Block obvious dynamic execution / import escape hatches.
  const patterns = [
    /\b__import__\b/,
    /\b(eval|exec|compile)\b/,
    /\bimportlib\b/,
    /\b__builtins__\b/,
    /\b(globals|locals|vars|getattr|setattr|delattr)\s*\(/,
    /\bopen\s*\(/,
  ];
  for (const p of patterns) {
    if (p.test(code)) throw new Error("-1");
  }

  // Parse import statements and allowlist safe stdlib modules.
  // - Blocks any relative imports (from .foo import bar)
  // - Blocks any module not explicitly allowlisted
  const importRe = /^\s*(?:from\s+([^\s]+)\s+import\b|import\s+([^\n]+))\s*$/gm;
  let m;
  while ((m = importRe.exec(code))) {
    const fromMod = m[1] ? String(m[1]).trim() : null;
    const importList = m[2] ? String(m[2]).trim() : null;

    if (fromMod) {
      if (fromMod.startsWith(".")) throw new Error("-1");
      const top = fromMod.split(".")[0];
      if (blockedTopLevelModules.has(top)) throw new Error("-1");
      if (!allowedTopLevelModules.has(top)) throw new Error("-1");
      continue;
    }

    if (importList) {
      const parts = importList
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const part of parts) {
        const mod = part.split(/\s+as\s+/i)[0].trim();
        if (!mod) throw new Error("-1");
        if (mod.startsWith(".")) throw new Error("-1");
        const top = mod.split(".")[0];
        if (blockedTopLevelModules.has(top)) throw new Error("-1");
        if (!allowedTopLevelModules.has(top)) throw new Error("-1");
      }
    }
  }
}

function sanitizeJS(code) {
  // Defense-in-depth only. Docker sandboxing is the primary security boundary.
  const blockedModules = [
    "fs",
    "child_process",
    "cluster",
    "net",
    "tls",
    "dgram",
    "http",
    "https",
    "dns",
    "vm",
    "worker_threads",
    "module"
  ];

  const blockedModuleRe = blockedModules
    .map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const patterns = [
    // CommonJS + ESM dynamic import
    new RegExp(`\\brequire\\s*\\(\\s*['\"](?:node:)?(?:${blockedModuleRe})(?:\\/[^'\"]*)?['\"]\\s*\\)`, "m"),
    new RegExp(`\\bimport\\s*\\(\\s*['\"](?:node:)?(?:${blockedModuleRe})(?:\\/[^'\"]*)?['\"]\\s*\\)`, "m"),

    // Process access and native bindings
    /\bprocess\s*\./,
    /\bglobalThis\s*(?:\.\s*process|\[\s*['\"]process['\"]\s*\])\b/,
    /\bprocess\s*\.\s*binding\s*\(/,

    // Dynamic code execution and common bypass gadgets
    /\b(eval|Function)\b\s*\(/,
    /\.\s*constructor\s*\(/,
    /\bmodule\s*\.\s*constructor\b/,
  ];

  for (const p of patterns) {
    if (p.test(code)) throw new Error("-1");
  }
}

function sanitizeCPP(code) {
  const patterns = [
    /#include\s*<\s*(unistd|sys\/|arpa\/|netinet\/|fcntl|netdb|ifaddrs|resolv|linux\/)\b/,
    /\b(system|fork|exec|popen|kill|syscall|clone|ptrace|mmap|mprotect|mount|unshare|setns|chroot|prctl)\s*\(/,
    /\bstd::system\s*\(/
  ];
  patterns.forEach(p => {
    if (p.test(code)) throw new Error("-1");
  });
}

function sanitizeCode(language, code) {
  const clean = stripComments(code, language);

  if (language === "python") {
    sanitizePython(clean);
    return clean;
  }

  if (language === "javascript") {
    sanitizeJS(clean);
    return clean;
  }

  if (language === "cpp") {
    sanitizeCPP(clean);
    return clean;
  }

  return clean;
}

  const handleSubmit = async () => {
    if (isRunning || !attemptId) return;

    resetTerminal();
    setIsRunning(true);

    try {
      const result = await submitExamAttempt(attemptId, code);

      write("\n=== EXAM RESULT ===\n");
      write(`Score: ${result.score_percentage}%\n`);
      write(`Passed: ${result.passed ? "YES" : "NO"}\n`);
      write("====================\n\n");

      if (result.results) {
        result.results.forEach((r) => {
          write(
            `Test ${r.test_index}: ${
              r.passed ? "✅ Passed" : "❌ Failed"
            } (${r.execution_time_ms}ms)\n`
          );
        });
      }

    } catch (err) {
      write("\n❌ Submission failed\n");
    }

    setIsRunning(false);
  };

function normalizeOutput(text) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function normalizeValidationText(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function validateExerciseSubmission({ output, code, quest }) {
  const safeCode = String(code ?? "");
  const normalizedOutput = normalizeValidationText(output);
  const mode = String(
    quest?.validation_mode || quest?.requirements?.validation_mode || ""
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  const isMultiObjectiveMode =
    mode === "MULTI_OBJECTIVE" ||
    mode === "MUTI_OBJECTIVE" ||
    Array.isArray(quest?.requirements?.objectives);

  if (!isMultiObjectiveMode) {
    return { success: true, objectives: null };
  }

  const objectives = quest?.requirements?.objectives || [];
  const results = {};
  let allPassed = true;

  for (const obj of objectives) {
    let passed = false;

    if (obj.type === "output_contains") {
      passed = normalizedOutput.includes(obj.value);
    } else if (obj.type === "output_equals") {
      passed = normalizedOutput === normalizeValidationText(obj.value);
    } else if (obj.type === "output_regex") {
      const regex = new RegExp(obj.value, "m");
      passed = regex.test(normalizedOutput);
    } else if (obj.type === "code_contains") {
      passed = safeCode.includes(obj.value);
    } else if (obj.type === "code_regex") {
      const regex = new RegExp(obj.value, "m");
      passed = regex.test(safeCode);
    } else if (obj.type === "min_print_count") {
      const matches = safeCode.match(/\bprint\s*\(/g);
      const count = matches ? matches.length : 0;
      passed = count >= obj.value;
    }

    results[obj.id] = {
      passed,
      label: obj.label,
      expected: obj.value,
    };

    if (!passed) allPassed = false;
  }

  return {
    success: allPassed,
    objectives: results,
  };
}

/* ===============================
   GLOBAL DOCKER QUEUES
=============================== */

// Adjust based on server CPU cores
const MAX_EXAM_CONTAINERS = 10;
const MAX_EXERCISE_CONTAINERS = 10;

let activeExamContainers = 0;
let activeExerciseContainers = 0;

const examQueue = [];
const exerciseQueue = [];

function enqueueExam(task) {
  return new Promise((resolve, reject) => {
    examQueue.push({ task, resolve, reject });
    processExamQueue();
  });
}

function processExamQueue() {
  if (
    activeExamContainers >= MAX_EXAM_CONTAINERS ||
    examQueue.length === 0
  ) return;

  const { task, resolve, reject } = examQueue.shift();
  activeExamContainers++;

  task()
    .then(resolve)
    .catch(reject)
    .finally(() => {
      activeExamContainers--;
      processExamQueue();
    });
}

function enqueueExercise(task) {
  return new Promise((resolve, reject) => {
    exerciseQueue.push({ task, resolve, reject });
    processExerciseQueue();
  });
}

function processExerciseQueue() {
  if (
    activeExerciseContainers >= MAX_EXERCISE_CONTAINERS ||
    exerciseQueue.length === 0
  ) return;

  const { task, resolve, reject } = exerciseQueue.shift();
  activeExerciseContainers++;

  task()
    .then(resolve)
    .catch(reject)
    .finally(() => {
      activeExerciseContainers--;
      processExerciseQueue();
    });
}

/* ===============================
   NUMBER EXTRACTION (SCORING)
=============================== */

function extractNumbers(text) {
  return (text.match(/-?\d+/g) || []).map(Number);
}

function extractLastTwoNumbers(text) {
  const nums = extractNumbers(text);
  return nums.slice(-2);
}

function isNumericOnlyExpected(expectedRaw) {
  const s = String(expectedRaw ?? "").trim();
  if (!s) return false;
  // Only numbers separated by whitespace/newlines.
  return /^-?\d+(?:\s+-?\d+)*\s*$/.test(s);
}

function matchesStdinExpected(output, expectedRaw) {
  const outNorm = normalizeValidationText(String(output ?? ""));
  const expNorm = normalizeValidationText(String(expectedRaw ?? ""));

  // First: strict match (original behavior).
  if (outNorm === expNorm) return true;

  // Back-compat: allow extra prompts/text, match by trailing numbers.
  // This supports solutions that print input prompts or extra lines.
  if (!isNumericOnlyExpected(expNorm)) return false;

  const expectedNums = extractNumbers(expNorm);
  if (!expectedNums.length) return false;

  const outNums = extractNumbers(outNorm);
  if (outNums.length < expectedNums.length) return false;

  const tail = outNums.slice(-expectedNums.length);
  return isDeepStrictEqual(tail, expectedNums);
}

function buildStdoutDisplay(output, expectedRaw) {
  const raw = String(output ?? "");

  // Preserve compiler/runtime diagnostics as-is.
  if (raw.startsWith("COMPILE_ERROR")) return raw.trim();
  if (hasExecutionError(raw, "python") || hasExecutionError(raw, "javascript") || hasExecutionError(raw, "cpp")) {
    return raw.trim();
  }

  const outNorm = normalizeValidationText(raw);
  const expNorm = normalizeValidationText(String(expectedRaw ?? ""));

  // If expected is numeric-only, show just the designated numeric output (last N numbers).
  if (isNumericOnlyExpected(expNorm)) {
    const expectedNums = extractNumbers(expNorm);
    const outNums = extractNumbers(outNorm);
    if (expectedNums.length && outNums.length >= expectedNums.length) {
      return outNums.slice(-expectedNums.length).join("\n");
    }
  }

  return outNorm;
}

/* ===============================
   DOCKER EXECUTION (SINGLE TEST)
=============================== */

async function runSingleTest(language, code, input = "", mode = "stdin", functionName = null) {
  let outputSize = 0;
  const MAX_OUTPUT = 1_000_000;
  return enqueueExam(() =>
    new Promise((resolve, reject) => {

      const config = LANG_CONFIG[language];
      if (!config) return reject(new Error("Unsupported language"));

      try {

        const sanitized = sanitizeCode(language, code);

        const tempDir = path.join(TMP_DIR, crypto.randomUUID());
        fs.mkdirSync(tempDir);

        let finalCode = sanitized;

        /* ===============================
           FUNCTION MODE (JS LESSONS)
        =============================== */

        if (mode === "function") {
          if (!functionName) {
            return reject(new Error("functionName required for function mode"));
          }

          if (language === "javascript") {
            finalCode = `
 const __rawInput = ${JSON.stringify(input)};

/* USER CODE START */
${sanitized}
/* USER CODE END */

let __arg = __rawInput;
if (typeof __rawInput === "string") {
  const s = __rawInput.trim();
  const looksJson =
    s.startsWith("[") ||
    s.startsWith("{") ||
    s === "true" ||
    s === "false" ||
    s === "null" ||
    /^-?\\d+(?:\\.\\d+)?$/.test(s) ||
    (s.startsWith('"') && s.endsWith('"'));
  if (looksJson) {
    try {
      __arg = JSON.parse(s);
    } catch {
      __arg = __rawInput;
    }
  }
}

  const __fnName = ${JSON.stringify(String(functionName))};
  let __fn = null;
  try {
    // functionName is server-controlled (from test case metadata)
    __fn = eval(__fnName);
  } catch {
    __fn = null;
  }
  if (typeof __fn !== "function") {
    console.log(
      "FUNCTION_NOT_FOUND: " + __fnName + " (define it in your code or switch the test case mode to stdin)"
    );
    process.exit(0);
  }
  // Accept either {"args": [...]} OR a raw JSON array [...] as the argument list.
  const __args =
    (__arg && typeof __arg === "object" && !Array.isArray(__arg) && Array.isArray(__arg.args))
      ? __arg.args
      : (Array.isArray(__arg) ? __arg : null);
  const result = __args ? __fn(...__args) : __fn(__arg);
  console.log("OUTPUT:", JSON.stringify(result));
  `;
           } else if (language === "python") {
             const inputJsonText = typeof input === "string" ? input : JSON.stringify(input);
             // Embed as a Python string and parse via json.loads.
             const inputJsonLiteral = JSON.stringify(String(inputJsonText));

             finalCode = [
               "import json",
               "",
               `input_json = ${inputJsonLiteral}`,
               "",
               String(sanitized ?? ""),
               "",
               "arg = None",
               "if isinstance(input_json, str) and input_json.strip():",
               "  try:",
               "    arg = json.loads(input_json)",
               "  except Exception:",
               "    arg = input_json",
               "",
               "def __call(fn, value):",
               "  # Avoid ambiguity: JSON arrays are passed as a single argument by default.",
               "  # To pass multiple positional/keyword args, wrap input as:",
               "  #   {\"args\": [...], \"kwargs\": {...}}",
               "  # CodeMania: also allow passing a raw JSON array as positional args.",
               "  if isinstance(value, (list, tuple)):",
               "    return fn(*value)",
               "  if isinstance(value, dict) and (\"args\" in value or \"kwargs\" in value):",
               "    args = value.get(\"args\", [])",
               "    kwargs = value.get(\"kwargs\", {})",
               "    if not isinstance(args, (list, tuple)):",
               "      args = [args]",
               "    if not isinstance(kwargs, dict):",
               "      kwargs = {}",
               "    return fn(*args, **kwargs)",
               "  return fn(value)",
               "",
               `fn = globals().get(${JSON.stringify(String(functionName))})`,
               "if not callable(fn):",
               `  print(\"FUNCTION_NOT_FOUND:\", ${JSON.stringify(String(functionName))})`,
               "else:",
               "  result = __call(fn, arg)",
               "  print(\"OUTPUT:\", json.dumps(result))",
               "",
             ].join("\n");
           } else if (language === "cpp") {
             const inputText = typeof input === "string" ? input : JSON.stringify(input);
             // Raw string literal; keep it simple (user parses as needed).
             const safe = String(inputText).replace(/\)"/g, ')""');

            finalCode = `
#include <bits/stdc++.h>
using namespace std;

/* USER CODE START */
${sanitized}
/* USER CODE END */

int main() {
  std::string input = R"JSON(${safe})JSON";
  auto result = ${functionName}(input);
  std::cout << "OUTPUT: " << result;
  return 0;
}
`;
          }
        }

        const filePath = path.join(tempDir, config.file);
        fs.writeFileSync(filePath, finalCode);
        fs.chmodSync(filePath, 0o644);

        const docker = spawn("docker", [
          "run", "--rm", "-i",
          "--network", "none",
          "--read-only",
          "--pids-limit", "64",
          "--memory", "256m",
          "--cpus", "0.5",
          "--ulimit", "nproc=64:64",
          "--ulimit", "nofile=64:64",
          "--ulimit", "core=0",
          "--cap-drop=ALL",
          "--security-opt=no-new-privileges",
          "--user", "1000:1000",
          "-v", `${tempDir}:/workspace`,
          "--tmpfs", "/tmp:rw,exec,nosuid,size=64m",
          "-w", "/workspace",
          config.image,
          ...config.cmd
        ]);

        let output = "";

        const timeout = setTimeout(() => {
          docker.kill("SIGKILL");
        }, 10000);

        docker.stdout.on("data", d => {

          outputSize += d.length;

          if (outputSize > MAX_OUTPUT) {
            docker.kill("SIGKILL");
            output = "Output limit exceeded";
            return;
          }

          output += d.toString();
        });
        docker.stderr.on("data", d => output += d.toString());

        docker.on("close", (code) => {
          clearTimeout(timeout);
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch {}

          if (code !== 0) {
            resolve(`COMPILE_ERROR\n${output.trim()}`);
            return;
          }
          resolve(output.trim());
        });

        docker.on("error", err => {
          clearTimeout(timeout);

          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch {}

          reject(err);
        });   

        /* ===============================
           INPUT HANDLING
        =============================== */

        if (mode === "stdin") {

          let inputData = input;

          if (typeof inputData !== "string") {
            inputData = JSON.stringify(inputData);
          }

          docker.stdin.write(inputData + "\n");
        }

        docker.stdin.end();

      } catch (err) {
        reject(err);
      }

    })
  );
}

async function runDomValidation(base_html, user_code, validation) {
  return enqueueExam(() =>
    new Promise((resolve, reject) => {

      const payload = JSON.stringify({
        base_html,
        user_code,
        validation
      });

      const docker = spawn("docker", [
        "run", "--rm", "-i",

        "--network", "none",
        "--read-only",
        "--pids-limit", "64",
        "--memory", "128m",
        "--cpus", "0.5",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "--user", "1000:1000",
        "--tmpfs", "/tmp:rw,nosuid,size=32m",

        "codemania-dom-runner"
      ]);

      let output = "";
      let errorOutput = "";

      const timeout = setTimeout(() => {
        docker.kill("SIGKILL");
        reject(new Error("DOM validation timeout"));
      }, 30000);

      docker.stdout.on("data", d => {
        output += d.toString();
      });

      docker.stderr.on("data", d => {
        errorOutput += d.toString();
      });

      docker.on("close", (code) => {
        clearTimeout(timeout);

        if (errorOutput) {
          console.error("DOM STDERR:", errorOutput);
        }

        try {
          const parsed = JSON.parse(output.trim());
          resolve(parsed);
        } catch (err) {
          console.error("RAW OUTPUT:", output);
          reject(new Error("Invalid DOM runner output"));
        }
      });

      docker.on("error", err => {
        clearTimeout(timeout);
        reject(err);
      });

      // 🔥 IMPORTANT FIX
      docker.stdin.write(payload);
      docker.stdin.end();
    })
  );
}

function matchRequiredFields(output, expected) {

  if (!Array.isArray(output) || !Array.isArray(expected)) {
    return false;
  }

  if (output.length !== expected.length) {
    return false;
  }

  for (let i = 0; i < expected.length; i++) {

    const outObj = output[i];
    const expObj = expected[i];

    for (const key of Object.keys(expObj)) {

      if (outObj[key] !== expObj[key]) {
        return false;
      }

    }
  }

  return true;
}

function isArrayOfPlainObjects(value) {
  return (
    Array.isArray(value) &&
    value.every((v) => v && typeof v === "object" && !Array.isArray(v))
  );
}

function parseMaybeJson(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") return value;
  const s = value.trim();
  if (!s) return "";

  const looksJson =
    s.startsWith("[") ||
    s.startsWith("{") ||
    s === "true" ||
    s === "false" ||
    s === "null" ||
    /^-?\d+(?:\.\d+)?$/.test(s) ||
    (s.startsWith('"') && s.endsWith('"'));

  if (!looksJson) return s;

  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

/* ===============================
   EXAM MODE (MULTIPLE TESTS)
=============================== */

app.post("/exam/run", async (req, res) => {
  try {
    // 🔐 Internal protection (optional but recommended)
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { language, code, testCases } = req.body;

    if (!language || !code || !Array.isArray(testCases)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    let passed = 0;
    let output;
    const results = [];

    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];

      const expectedRaw =
        test?.expected ??
        test?.expected_output ??
        test?.expectedOutput ??
        test?.output ??
        test?.expectedResult ??
        "";

      const start = Date.now();

      try{
        output = await runSingleTest(
          language,
          code,
          test.input || "",
          test.mode || "stdin",
          test.functionName || null
        );
      } catch (err) {
        output = err.message;
      }
      

      const executionTime = Date.now() - start;

      console.log(`Test ${i + 1}:`, output);

      let success = false;

      if (test.mode === "function") {

        let cleanOutput = String(output ?? "").trim();
        if (cleanOutput.startsWith("OUTPUT:")) {
          cleanOutput = cleanOutput.replace(/^OUTPUT:\s*/, "");
        }

        const expected = parseMaybeJson(expectedRaw);

        // Prefer JSON compare when possible.
        try {
          const parsedOutput = JSON.parse(cleanOutput);

          if (isArrayOfPlainObjects(expected) && Array.isArray(parsedOutput)) {
            // Back-compat partial matching for arrays of objects.
            success = matchRequiredFields(parsedOutput, expected);
          } else {
            success = isDeepStrictEqual(parsedOutput, expected);
          }
        } catch {
          // Fallback: treat as plain string output.
          success =
            normalizeValidationText(cleanOutput) ===
            normalizeValidationText(String(expected ?? ""));
        }

      } else {

        // STDIN mode: compare full output.
        success = matchesStdinExpected(output, expectedRaw);
      }

      if (success) passed++;

      results.push({
        test_index: i + 1,
        passed: success,
        execution_time_ms: executionTime,
        stdout: String(output ?? ""),
        stdout_display: test.mode === "stdin" ? buildStdoutDisplay(output, expectedRaw) : String(output ?? "").trim(),
        expected: String(expectedRaw ?? "")
      });
    }

    const total = testCases.length;

    res.json({
      passed,
      total,
      score: total === 0 ? 0 : Math.round((passed / total) * 100),
      results
    });

  } catch (err) {
    console.error("Exam execution error:", err);
    res.status(500).json({ error: "Execution failed" });
  }
});

/* ===============================
   DOM VALIDATION ENDPOINT
=============================== */

app.post("/dom/run", async (req, res) => {
  try {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { base_html, user_code, validation } = req.body;

    if (typeof base_html !== "string" || typeof user_code !== "string") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const result = await runDomValidation(
      base_html,
      user_code,
      validation || {}
    );

    return res.json(result);

  } catch (err) {
    console.error("DOM execution error:", err);
    return res.status(500).json({ error: "Execution failed" });
  }
});

app.post("/exercise/validate", async (req, res) => {
  try {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { output, code, quest, programming_language_id } = req.body;

    if (!quest || typeof output !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid payload",
      });
    }

    const LANGUAGE_MAP = {
      1: "python",
      2: "cpp",
      3: "javascript"
    };

    const language = LANGUAGE_MAP[programming_language_id];
    console.log("Language:", language);

    const testCases = quest.requirements?.test_cases || [];

    const testResults = [];
    let runtimePassed = true;

    if (testCases.length > 0) {

      for (const test of testCases) {

        const testOutput = await runSingleTest(
          language,
          code,
          test.input,
          "stdin"
        );

        const passed =
          normalizeOutput(testOutput).includes(normalizeOutput(test.expected));

        testResults.push({
          input: test.input,
          expected: test.expected,
          output: testOutput,
          passed
        });

        if (!passed) runtimePassed = false;
      }

    }

    const result = validateExerciseSubmission({ output, code, quest });

    return res.status(200).json({
      success: runtimePassed && result.success,
      runtime_passed: runtimePassed,
      objectives: result.objectives,
      test_results: testResults
    });
  } catch (err) {
    console.error("Exercise validation error:", err);
    return res.status(500).json({
      success: false,
      message: "Execution failed",
    });
  }
});


/* ===============================
   WEBSOCKET EXECUTION
=============================== */

wss.on("connection", (ws) => {
  let docker = null;
  let tempDir = null;
  let timeout = null;
  let outputSize = 0;

  ws.__isAlive = true;
  ws.on("pong", () => {
    ws.__isAlive = true;
  });

  const MAX_OUTPUT = 1_000_000;
  const EXEC_TIMEOUT = 15000;
  function resetTimeout() {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      if (docker) docker.kill("SIGKILL");
    }, EXEC_TIMEOUT);
  }

  ws.on("message", async (raw) => {
    let msg;

    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send("Invalid JSON\n");
      return;
    }

    // Presence channel (online users)
    if (msg && typeof msg === "object" && typeof msg.type === "string" && msg.type.startsWith("presence:")) {
      if (!ws.__isPresence) {
        ws.__isPresence = true;
        presenceClients.add(ws);
      }

      if (msg.type === "presence:identify") {
        const userId = msg.userId ?? msg.user_id ?? null;
        ws.__presenceUserId = userId ? String(userId) : null;
        ws.__presenceUsername = msg.username ? String(msg.username) : null;
      }

      if (msg.type === "presence:unsubscribe") {
        presenceClients.delete(ws);
        ws.__isPresence = false;
      }

      // Subscribe (or any presence message) returns current stats
      safeJsonSend(ws, {
        type: "presence:update",
        ...getPresenceStats(),
      });
      broadcastPresence();
      return;
    }

    const { mode = "exercise", language, code, testCases = [] } = msg;

    if (!docker) {
      try {
        const lang = LANG_CONFIG[language];

        if (!lang) {
          ws.send("Unsupported language\n");
          ws.close();
          return;
        }

        const sanitized = sanitizeCode(language, code);

        tempDir = path.join(TMP_DIR, crypto.randomUUID());
        fs.mkdirSync(tempDir);

        fs.writeFileSync(path.join(tempDir, lang.file), sanitized);

        await enqueueExercise(() =>
          new Promise((resolve, reject) => {

            docker = spawn("docker", [
              "run", "--rm", "-i",
              "--network", "none",
              "--read-only",
              "--pids-limit", "64",
              "--memory", "256m",
              "--cpus", "0.5",
              "--ulimit", "nproc=64:64",
              "--ulimit", "nofile=64:64",
              "--cap-drop=ALL",
              "--security-opt=no-new-privileges",
              "--user", "1000:1000",
              "-v", `${tempDir}:/workspace`,
              "--tmpfs", "/tmp:rw,exec,nosuid,size=64m",
              "-w", "/workspace",
              lang.image,
              ...lang.cmd
            ]);

            resolve();
          })
        );

        resetTimeout();

        docker.stdout.on("data", (d) => {
          outputSize += d.length;
          if (outputSize > MAX_OUTPUT) {
            docker.kill("SIGKILL");
            ws.send("Output limit exceeded\n");
            return;
          }
          ws.send(d.toString());
        });

        docker.stderr.on("data", (d) => {
          outputSize += d.length;
          if (outputSize > MAX_OUTPUT) {
            docker.kill("SIGKILL");
            ws.send("Output limit exceeded\n");
            return;
          }
          ws.send(d.toString());
        });

        docker.on("close", () => {
          clearTimeout(timeout);
          ws.close();
        });

      } catch (err) {
        ws.send(err.message + "\n");
        ws.close();
      }

      return;
    }

    // STDIN for practice mode
    if (docker && msg.stdin) {
      docker.stdin.write(msg.stdin + "\n");
      resetTimeout();
    }
  });

  ws.on("close", () => {
    try {
      if (ws.__isPresence) {
        presenceClients.delete(ws);
        ws.__isPresence = false;
        broadcastPresence();
      }
      if (docker) docker.kill("SIGKILL");
      if (timeout) clearTimeout(timeout);
      if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error("Error cleaning up resources:", err);
    }
  });
});
