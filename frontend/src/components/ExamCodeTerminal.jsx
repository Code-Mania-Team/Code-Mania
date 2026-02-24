import React, { useEffect, useRef, useState, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { Play } from "lucide-react";
import styles from "../styles/ExamCodeTerminal.module.css";

/* ===============================
   LANGUAGE FROM URL PARAMS
=============================== */
function getLanguageFromPathname() {
  const pathname = window.location.pathname;
  
  if (pathname.includes("/python")) return "python";
  if (pathname.includes("/javascript")) return "javascript";
  if (pathname.includes("/cpp")) return "cpp";
  
  return "python";
}

function getMonacoLang(lang) {
  if (lang === "cpp") return "cpp";
  if (lang === "javascript") return "javascript";
  return "python";
}

function getStarterCode(lang) {
  switch (lang) {
    case "javascript":
      return `// Write code below ❤️
console.log("Hello world");`;

    case "cpp":
      return `#include <iostream>

int main() {
  std::cout << "Hello world" << std::endl;
  return 0;
}`;

    default:
      return `# Write code below ❤️
print("Hello world")`;
  }
}

const ExamCodeTerminal = ({ language, initialCode, attemptId, submitAttempt, onResult, attemptNumber = 1, locked = false }) => {
  const monacoLang = getMonacoLang(language);
  const [code, setCode] = useState(initialCode || "");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [inputBuffer, setInputBuffer] = useState("");
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const storageKey = `exam_code_${attemptId}_${language}`;
  const MAX_ATTEMPTS = 5;
  const attemptsExhausted = attemptNumber >= MAX_ATTEMPTS;
  const disableSubmit = isRunning || locked || attemptsExhausted;
  const terminalBodyRef = useRef(null);

  const socketRef = useRef(null);
  const outputRef = useRef("");

  useEffect(() => {
    const el = terminalBodyRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [output, inputBuffer]);

  useEffect(() => {
    setCode(initialCode || "");
  }, [initialCode]);

  useEffect(() => {
    if (!attemptId) return;

    const saved = localStorage.getItem(storageKey);

    if (saved !== null) {
      setCode(saved);
    } else if (initialCode) {
      setCode(initialCode);
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) return;

    localStorage.setItem(storageKey, code);
  }, [code, attemptId]);

  /* ===============================
     TERMINAL WRITE
  =============================== */
  const write = (text) => {
    outputRef.current += text;
    setOutput(outputRef.current);
  };

  const resetTerminal = () => {
    outputRef.current = "";
    setOutput("");
    setInputBuffer("");
    setWaitingForInput(false);
  };

  /* ===============================
     RUN (WS CONNECT)
  =============================== */
  const handleRun = () => {
    if (isRunning) return;

    resetTerminal();
    setIsRunning(true);

    let finalOutput = "";

    const socket = new WebSocket("wss://terminal.codemania.fun");
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          language,
          code
        })
      );
    };

    socket.onmessage = (e) => {
      const text = e.data;

      finalOutput += text;
      write(text);

      // If output doesn't end with newline,
      // assume program is waiting for input
      if (!text.endsWith("\n")) {
        setWaitingForInput(true);
      }
    };

    socket.onclose = () => {
      setWaitingForInput(false);
      setIsRunning(false);
    };

    socket.onerror = () => {
      write("\n❌ Connection error\n");
      setIsRunning(false);
    };
  };

  const handleSubmit = async () => {
    if (isRunning || !attemptId) return;

    resetTerminal();
    setIsRunning(true);

    try {
      const result = await submitAttempt(code);

      if (!result) {
        write("\n❌ Submission failed\n");
        setIsRunning(false);
        return;
      }
      if (result.score_percentage === 100) {
        localStorage.removeItem(storageKey);
      }

      write("\n=== EXAM RESULT ===\n");
      write(`Score: ${result.score_percentage}%\n`);
      write(`Passed: ${result.passed ? "YES" : "NO"}\n`);
      write("====================\n\n");

      if (result.results) {
        console.log("Test results:", result.results);
        result.results.forEach((r) => {
          write(
            `Test ${r.test_index}: ${
              r.passed ? "✅ Passed" : "❌ Failed"
            } (${r.execution_time_ms}ms)\n`
          );
        });
      }

      onResult?.(result);

    } catch (err) {
      console.error("Submission error:", err);
    }

    setIsRunning(false);
  };

  /* ===============================
     HANDLE USER INPUT
  =============================== */
  const handleKeyDown = (e) => {
    if (!waitingForInput || !socketRef.current) return;

    if (e.key === "Enter") {
      socketRef.current.send(
        JSON.stringify({ stdin: inputBuffer })
      );

      write(inputBuffer + "\n");
      setInputBuffer("");
      setWaitingForInput(false);
      e.preventDefault();
      return;
    }

    if (e.key === "Backspace") {
      setInputBuffer(prev => prev.slice(0, -1));
      e.preventDefault();
      return;
    }

    if (e.key.length === 1) {
      setInputBuffer(prev => prev + e.key);
      e.preventDefault();
    }
  };

  return (
    <div className={styles.examCodeContainer}>
      <div className={styles.examCodeEditor}>
        <div className={styles.examEditorHeader}>
          <span>
            {language === "cpp"
              ? "main.cpp"
              : language === "javascript"
              ? "main.js"
              : "script.py"}
          </span>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className={styles.examSubmitBtn}
              onClick={handleRun}
              disabled={isRunning}
            >
              <Play size={16} />
              Run
            </button>

            <button
              className={styles.examSubmitBtn}
              disabled={disableSubmit}
              style={{
                background: disableSubmit ? "#475569" : "#10b981",
                cursor: disableSubmit ? "not-allowed" : "pointer",
                opacity: disableSubmit ? 0.6 : 1
              }}
              onClick={handleSubmit}
            >
              {locked
                ? "Locked (100%)"
                : attemptsExhausted
                ? "No Attempts Left"
                : "Submit"}
            </button>
          </div>
        </div>

        <Editor
          height="100%"
          language={monacoLang}
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false
          }}
        />
      </div>

      <div
        className={styles.examTerminal}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          marginTop: "1.5rem",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 15px 50px rgba(0,0,0,0.45)",
          background: "linear-gradient(180deg, #0b1220, #070f1c)",
          display: "flex",
          flexDirection: "column",
          height: "500px"
        }}
      >
  {/* HEADER */}
  <div
    style={{
      padding: "0.7rem 1rem",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(255,255,255,0.03)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}
  >
    <span style={{ fontWeight: 600, opacity: 0.8 }}>
      Terminal
    </span>

    <span
      style={{
        fontSize: "0.8rem",
        padding: "3px 10px",
        borderRadius: "999px",
        background: isRunning
          ? "rgba(59,130,246,0.2)"
          : "rgba(34,197,94,0.15)",
        color: isRunning ? "#3b82f6" : "#22c55e"
      }}
    >
      {isRunning ? "Running..." : "Idle"}
    </span>
  </div>

  {/* BODY */}
  <div
      ref={terminalBodyRef}
      style={{
      flex: 1,
      overflowY: "auto",
      padding: "1rem",
      fontFamily: "monospace",
      fontSize: "0.9rem",
      lineHeight: "1.5",
      background: "#050b17",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word"
    }}
  >
    <pre style={{ margin: 0, color: "#cbd5e1" }}>
      {output}

      {waitingForInput && (
        <>
          <span style={{ color: "#22c55e" }}>
            {inputBuffer}
          </span>
          <span style={{ color: "#22c55e" }}>|</span>
        </>
      )}

      {!output && !waitingForInput && (
        <span style={{ color: "#22c55e", opacity: 0.7 }}>
          ▶ Ready for execution
        </span>
      )}
    </pre>
  </div>
  {testResults.length > 0 && (
    <div style={{ marginTop: "1.5rem" }}>
      <h4 style={{ marginBottom: "1rem" }}>Test Results</h4>

      {testResults.map((t, index) => (
        <div
          key={index}
          style={{
            padding: "1rem",
            borderRadius: "10px",
            marginBottom: "0.8rem",
            background: t.passed
              ? "rgba(16,185,129,0.1)"
              : "rgba(239,68,68,0.1)",
            border: `1px solid ${
              t.passed ? "#10b981" : "#ef4444"
            }`
          }}
        >
          <strong>Test {index + 1}</strong>
          <div>Status: {t.passed ? "✅ Passed" : "❌ Failed"}</div>
        </div>
      ))}
    </div>
  )}
</div>
    </div>

    
  );
};

export default ExamCodeTerminal;
