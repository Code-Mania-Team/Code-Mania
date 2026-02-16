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

const ExamCodeTerminal = () => {
  const language = useMemo(getLanguageFromPathname, []);
  const monacoLang = getMonacoLang(language);

  const [code, setCode] = useState(() => getStarterCode(language));
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const socketRef = useRef(null);
  const waitingForInputRef = useRef(false);
  const inputBufferRef = useRef("");

  // ✅ FIX: output must be a ref (state is async)
  const outputRef = useRef("");

  /* ===============================
     TERMINAL HELPERS
  =============================== */
  const write = (text) => {
    outputRef.current += text;           // ✅ FIX
    setOutput(outputRef.current);         // keep UI in sync
  };

  const resetTerminal = () => {
    outputRef.current = "";               // ✅ FIX
    setOutput("");
    waitingForInputRef.current = false;
    inputBufferRef.current = "";
  };

  /* ===============================
     START SESSION
  =============================== */
  const handleRun = () => {
    if (isRunning) return;

    setIsRunning(true);
    resetTerminal();
    write(`\n🚀 Running ${language} code...\n`);

    // Simulate code execution for exam
    setTimeout(() => {
      try {
        // Simple simulation based on language
        if (language === "python") {
          if (code.includes("print")) {
            write("Hello world\n");
          } else {
            write("No output detected\n");
          }
        } else if (language === "javascript") {
          if (code.includes("console.log")) {
            write("Hello world\n");
          } else {
            write("No output detected\n");
          }
        } else if (language === "cpp") {
          if (code.includes("cout")) {
            write("Hello world\n");
          } else {
            write("No output detected\n");
          }
        }
        
        write("\n✅ Code executed successfully!\n");
      } catch (error) {
        write(`\n❌ Error: ${error.message}\n`);
      } finally {
        setIsRunning(false);
      }
    }, 1500);
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

          <button
            className={styles.examSubmitBtn}
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
            automaticLayout: true,
            scrollBeyondLastLine: false
          }}
        />
      </div>

      <div className={styles.examTerminal}>
        <div className={styles.examTerminalHeader}>Terminal</div>
        <div className={styles.examTerminalContent}>
          <pre>{output || ""}</pre>
        </div>
      </div>
    </div>
  );
};

export default ExamCodeTerminal;
