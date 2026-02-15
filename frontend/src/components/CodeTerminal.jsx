import React, { useRef, useState, useMemo, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play } from "lucide-react";
import styles from "../styles/PythonExercise.module.css";
import allQuests from "../utilities/data/javascriptExercises.json";

/* ===============================
   LANGUAGE DETECTION
=============================== */

function getLanguageFromLocalStorage() {
  const title = (localStorage.getItem("lastCourseTitle") || "").toLowerCase();
  if (title.includes("javascript")) return "javascript";
  if (title.includes("c++")) return "cpp";
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
      return `console.log("Hello world");`;
    case "cpp":
      return `#include <iostream>

int main() {
  std::cout << "Hello world" << std::endl;
  return 0;
}`;
    default:
      return `print("Hello world")`;
  }
}

const InteractiveTerminal = () => {
  const language = useMemo(getLanguageFromLocalStorage, []);
  const monacoLang = getMonacoLang(language);

  const [code, setCode] = useState(() => getStarterCode(language));
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const socketRef = useRef(null);
  const iframeRef = useRef(null);
  const outputRef = useRef("");

  /* ===============================
     STAGE + QUEST DETECTION
  =============================== */

  const activeModule = Number(localStorage.getItem("activeJSModule"));
  const activeQuestId = Number(localStorage.getItem("activeQuestId"));

  const isDOMStage = () => {
    return language === "javascript" && activeModule === 4;
  };

  const quest = allQuests.find(q => q.id === 14);
  console.log("Active Quest:", quest);

  const questHTML = quest?.htmlTemplate;

  /* ===============================
     TERMINAL HELPERS
  =============================== */

  const write = (text) => {
    outputRef.current += text;
    setOutput(outputRef.current);
  };

  const resetTerminal = () => {
    outputRef.current = "";
    setOutput("");
  };

  /* ===============================
     DOCKER EXECUTION
  =============================== */

  const runViaDocker = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const socket = new WebSocket("wss://terminal.codemania.fun");
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ language, code }));
    };

    socket.onmessage = (e) => {
      write(e.data);
    };

    socket.onclose = () => {
      setIsRunning(false);
    };
  };

  /* ===============================
     PRELOAD DOM (AUTO LOAD HTML)
  =============================== */

  const preloadDOM = () => {
    if (!iframeRef.current) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              background: white;
              color: black;
              font-family: Arial;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${questHTML}
        </body>
      </html>
    `;

    iframeRef.current.srcdoc = html;
  };

  /* ===============================
     RUN JS ON EXISTING DOM
  =============================== */

  const runInIframe = () => {
    if (!iframeRef.current) return;

    const quest = allQuests.find(q => q.id === 14);

    const questHTML = quest?.htmlTemplate

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              background: white;
              color: black;
              font-family: Arial;
              padding: 20px;
            }
            pre {
              background: #eee;
              padding: 5px;
            }
          </style>
        </head>
        <body>

          ${questHTML}

          <hr />

          <script>
            const oldLog = console.log;
            console.log = function(...args) {
              const msg = args.join(" ");
              const pre = document.createElement("pre");
              pre.textContent = msg;
              document.body.appendChild(pre);
              oldLog.apply(console, args);
            };

            try {
              ${code}
            } catch (err) {
              const pre = document.createElement("pre");
              pre.style.color = "red";
              pre.textContent = err;
              document.body.appendChild(pre);
            }
          <\/script>

        </body>
      </html>
    `;

    iframeRef.current.srcdoc = html;
  };



  /* ===============================
     AUTO PRELOAD WHEN DOM STAGE
  =============================== */

  useEffect(() => {
    if (isDOMStage()) {
      preloadDOM();
    }
  }, [activeQuestId, activeModule]);

  /* ===============================
     RUN HANDLER
  =============================== */

  const handleRun = () => {
    resetTerminal();
    setIsRunning(true);

    if (isDOMStage()) {
      setTimeout(() => {
        runInIframe();
        setIsRunning(false);
      }, 50); // small delay ensures iframe is ready
      return;
    }

    runViaDocker();
  };

  /* ===============================
     RENDER
  =============================== */

  return (
    <div className={styles["code-container"]}>
      <div className={styles["code-editor"]}>
        <div className={styles["editor-header"]}>
          <span>
            {language === "cpp"
              ? "main.cpp"
              : language === "javascript"
              ? "script.js"
              : "script.py"}
          </span>

          <button
            className={styles["submit-btn"]}
            onClick={handleRun}
            disabled={isRunning}
          >
            <Play size={16} />
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>

        <Editor
          height="300px"
          language={monacoLang}
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true
          }}
        />
      </div>

      {/* DOCKER TERMINAL */}
      {!isDOMStage() && (
        <div className={styles["terminal"]}>
          <div className={styles["terminal-header"]}>Terminal</div>
          <div className={styles["terminal-content"]}>
            <pre>{output || "▶ Output will appear here"}</pre>
          </div>
        </div>
      )}

      {/* DOM PREVIEW */}
      {isDOMStage() && (
        <div style={{ marginTop: "20px" }}>
          <div className={styles["terminal-header"]}>
            DOM Preview (Sandboxed)
          </div>

          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            style={{
              width: "100%",
              height: "300px",
              background: "white",
              border: "1px solid #333"
            }}
          />
        </div>
      )}
    </div>
  );
};

export default InteractiveTerminal;
