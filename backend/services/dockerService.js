import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const TMP_DIR = path.resolve("./tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

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
    cmd: ["sh", "-lc", "g++ main.cpp -O2 -o /tmp/main && /tmp/main"]
  }
};

/* ===============================
   VALIDATION HELPERS
=============================== */

// Extract ALL numbers
function extractNumbers(text) {
  return (text.match(/-?\d+/g) || []).map(Number);
}

// Extract ONLY last two numbers (safer for this problem)
function extractLastTwoNumbers(text) {
  const nums = extractNumbers(text);
  return nums.slice(-2);
}

class DockerService {

  /* ===============================
     RUN EXAM (MULTIPLE TEST CASES)
  =============================== */
  async runExam({ language, code, testCases }) {

    let passed = 0;
    const results = [];

    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];

      const output = await this.runSingle({
        language,
        code,
        input: test.input || ""
      });

      const outputNumbers = extractLastTwoNumbers(output);
      const expectedNumbers = extractLastTwoNumbers(test.expected);

      const success =
        JSON.stringify(outputNumbers) === JSON.stringify(expectedNumbers);

      if (success) passed++;

      results.push({
        test_index: i + 1,
        passed: success,
        isHidden: test.isHidden || false,
        output: test.isHidden ? undefined : output
      });
    }

    const total = testCases.length;

    return {
      passed,
      total,
      score: total === 0 ? 0 : Math.round((passed / total) * 100),
      results
    };
  }

  /* ===============================
     RUN SINGLE TEST
  =============================== */
  async runSingle({ language, code, input }) {

    const config = LANG_CONFIG[language];
    if (!config) throw new Error("Unsupported language");

    const tempDir = path.join(TMP_DIR, crypto.randomUUID());
    fs.mkdirSync(tempDir);

    fs.writeFileSync(
      path.join(tempDir, config.file),
      code
    );

    return new Promise((resolve, reject) => {

      const docker = spawn("docker", [
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
        config.image,
        ...config.cmd
      ]);

      let output = "";

      const timeout = setTimeout(() => {
        docker.kill("SIGKILL");
      }, 10000);

      docker.stdout.on("data", d => output += d.toString());
      docker.stderr.on("data", d => output += d.toString());

      docker.on("close", () => {
        clearTimeout(timeout);
        fs.rmSync(tempDir, { recursive: true, force: true });
        resolve(output);
      });

      docker.on("error", err => {
        clearTimeout(timeout);
        fs.rmSync(tempDir, { recursive: true, force: true });
        reject(err);
      });

      docker.stdin.write(input);
      docker.stdin.end();
    });
  }
}

export default DockerService;