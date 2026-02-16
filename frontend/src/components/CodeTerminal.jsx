import React, { useEffect, useRef, useState, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { Play } from "lucide-react";
import styles from "../styles/PythonExercise.module.css";
/* ===============================
   LANGUAGE FROM LOCALSTORAGE
=============================== */
function getLanguageFromLocalStorage() {
  const title = (localStorage.getItem("lastCourseTitle") || "").toLowerCase();
  if (title.includes("python")) return "python";
  if (title.includes("javascript")) return "javascript";
  if (title.includes("java script")) return "javascript";
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
/* ===============================
   QUEST BRIDGE
=============================== */
function getActiveQuestId() {
  return Number(localStorage.getItem("activeQuestId"));
}
const InteractiveTerminal = () => {
  const language = useMemo(getLanguageFromLocalStorage, []);
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
     GAME PAUSE / RESUME
  =============================== */
  const handleEditorMount = (editor) => {
    editor.onDidFocusEditorText(() => {
      window.dispatchEvent(new CustomEvent("code-mania:terminal-active"));
    });
    editor.onDidBlurEditorText(() => {
      window.dispatchEvent(new CustomEvent("code-mania:terminal-inactive"));
    });
  };
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
    localStorage.setItem("lastSubmittedCode", code);
    if (socketRef.current) {
      socketRef.current.close();
    }
    resetTerminal();
    setIsRunning(true);
    // ✅ FIX: remove trailing space
    const socket = new WebSocket(
      "wss://terminal.codemania.fun"
    );
    socketRef.current = socket;
    socket.onopen = () => {
      // write(`▶ Running ${language.toUpperCase()}\n`);
      socket.send(
        JSON.stringify({
          language,
          code
        })
      );
    };
    socket.onmessage = (e) => {
      write(e.data);
      if (!e.data.endsWith("\n")) {
        waitingForInputRef.current = true;
      }
    };
    socket.onclose = () => {
      console.log("🧨 SOCKET CLOSED");
      setIsRunning(false);
      waitingForInputRef.current = false;
      const questId = getActiveQuestId();
      if (!questId) return;
      // ✅ FIX: dispatch FINAL output
      window.dispatchEvent(
        new CustomEvent("code-mania:terminal-result", {
          detail: {
            questId,
            output: outputRef.current,
            error: null
          }
        })
      );
      console.log("📤 terminal-result dispatched", {
        questId,
        output: outputRef.current
      });
    };
  };
  /* ===============================
     INLINE STDIN
  =============================== */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!waitingForInputRef.current || !socketRef.current) return;
      if (e.key === "Enter") {
        write("\n");
        socketRef.current.send(
          JSON.stringify({ stdin: inputBufferRef.current })
        );
        inputBufferRef.current = "";
        waitingForInputRef.current = false;
        e.preventDefault();
        return;
      }
      if (e.key === "Backspace") {
        inputBufferRef.current = inputBufferRef.current.slice(0, -1);
        outputRef.current = outputRef.current.slice(0, -1); // ✅ FIX
        setOutput(outputRef.current);
        e.preventDefault();
        return;
      }
      if (e.key.length === 1) {
        inputBufferRef.current += e.key;
        write(e.key);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  /* ===============================
     RENDER (UNCHANGED)
  =============================== */
  return (
    <div className={styles["code-container"]}>
      <div className={styles["code-editor"]}>
        <div className={styles["editor-header"]}>
          <span>
            {language === "cpp"
              ? "main.cpp"
              : language === "javascript"
              ? "main.js"
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
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false
          }}
        />
      </div>
      <div className={styles["terminal"]}>
        <div className={styles["terminal-header"]}>Terminal</div>
        <div className={styles["terminal-content"]}>
          <pre>{output || "▶ Output will appear here"}</pre>
        </div>
      </div>
    </div>
  );
};
export default InteractiveTerminal;
