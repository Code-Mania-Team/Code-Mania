import express from "express";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import e from "express";

const app = express();
app.use(express.json());

const server = app.listen(8000, () => {
  console.log("✅ Server running on http://localhost:8000");
});

const wss = new WebSocketServer({ server });

const TMP_DIR = path.resolve("./tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

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
  const patterns = [
    /\bimport\s+(os|sys|subprocess|socket|shutil|pathlib)\b/,
    /\bfrom\s+(os|sys|subprocess|socket|shutil|pathlib)\b/,
    /\b(__import__|eval|exec|compile)\s*\(/,
    /\bimportlib\b/
  ];
  patterns.forEach(p => {
    if (p.test(code)) throw new Error("-1");
  });
}

function sanitizeJS(code) {
  const patterns = [
    /\brequire\s*\(\s*['"](fs|child_process|cluster|net|tls)['"]\s*\)/,
    /\bprocess\./,
    /\b(eval|Function)\s*\(/
  ];
  patterns.forEach(p => {
    if (p.test(code)) throw new Error("-1");
  });
}

function sanitizeCPP(code) {
  const patterns = [
    /#include\s*<\s*(unistd|sys\/|arpa\/|netinet\/|fcntl)\b/,
    /\b(system|fork|exec|popen|kill)\s*\(/,
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

        if (language === "javascript" && mode === "function") {

          if (!functionName) {
            return reject(new Error("functionName required for function mode"));
          }

          finalCode = `
const input = ${JSON.stringify(input)};

/* USER CODE START */
${sanitized}
/* USER CODE END */

const result = ${functionName}(input);

console.log("OUTPUT:", JSON.stringify(result));
`;
        }

        const filePath = path.join(tempDir, config.file);
        fs.writeFileSync(filePath, finalCode);

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
          "-v", `${tempDir}:/workspace:ro`,
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

          docker.stdin.write(inputData);
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

        try {
          let cleanOutput = output.trim();

          // remove prefix added by wrapper
          if (cleanOutput.startsWith("OUTPUT:")) {
            cleanOutput = cleanOutput.replace(/^OUTPUT:\s*/, "");
          }

          const parsedOutput = JSON.parse(cleanOutput);

          const expected =
            typeof test.expected === "string"
              ? JSON.parse(test.expected)
              : test.expected;

          success = matchRequiredFields(parsedOutput, expected);
          console.log("EXPECTED:",parsedOutput, expected);
          console.log("SUCCESS: ",success);

        } catch {
          success = false;
        }

      } else {

        const outputNumbers = extractLastTwoNumbers(output);
        const expectedNumbers = extractLastTwoNumbers(String(test.expected));

        success =
          JSON.stringify(outputNumbers) ===
          JSON.stringify(expectedNumbers);
      }

      if (success) passed++;

      results.push({
        test_index: i + 1,
        passed: success,
        execution_time_ms: executionTime
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

    if (!base_html || typeof user_code !== "string") {
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

    const { output, code, quest } = req.body;

    if (!quest || typeof output !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid payload",
      });
    }

    const result = validateExerciseSubmission({ output, code, quest });
    return res.status(200).json(result);
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

  const MAX_OUTPUT = 1_000_000;
  const EXEC_TIMEOUT = 15000;
  function resetTimeout() {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      if (docker) docker.kill("SIGKILL");
    }, EXEC_TIMEOUT);
  }

  ws.on("message", async (raw) => {
    const msg = JSON.parse(raw.toString());
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
              "-v", `${tempDir}:/workspace:ro`,
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
      if (docker) docker.kill("SIGKILL");
      if (timeout) clearTimeout(timeout);
      if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error("Error cleaning up resources:", err);
    }
  });
});
