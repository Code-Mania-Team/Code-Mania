import React, { useRef, useState, useMemo, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play } from "lucide-react";
import styles from "../styles/PythonExercise.module.css";
import useValidateExercise from "../services/validateExercise";

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
  std::string name;
  std::cout << "Type something: ";
  std::cin >> name;
  std::cout << name << std::endl;
}`;
    default:
      return `a = input("Type something: ")
print(a)`;
  }
}

const InteractiveTerminal = ({ questId }) => {
  const language = useMemo(getLanguageFromLocalStorage, []);
  const monacoLang = getMonacoLang(language);

  const [code, setCode] = useState(() => getStarterCode(language));
  const [programOutput, setProgramOutput] = useState("");
  const [inputBuffer, setInputBuffer] = useState("");
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isQuestActive, setIsQuestActive] = useState(false);

  const validateExercise = useValidateExercise();

  const socketRef = useRef(null);
  const terminalRef = useRef(null);

  /* ===============================
     DOCKER EXECUTION
  =============================== */

  useEffect(() => {
    const handleQuestStarted = (e) => {
      const startedId = e.detail?.questId;
      if (startedId === questId) {
        setIsQuestActive(true);
      }
    };

    window.addEventListener("code-mania:quest-started", handleQuestStarted);

    return () =>
      window.removeEventListener("code-mania:quest-started", handleQuestStarted);
  }, [questId]);

  useEffect(() => {
    setIsQuestActive(false);
    setValidationResult(null);
  }, [questId]);


  const runViaDocker = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    let finalOutput = ""; // prevent stale state issue

    const socket = new WebSocket("wss://terminal.codemania.fun");
    socketRef.current = socket;

    socket.onopen = () => {
      window.dispatchEvent(new Event("code-mania:terminal-active"));
      socket.send(JSON.stringify({ language, code }));

      // 🔥 FORCE FOCUS
      setTimeout(() => {
        terminalRef.current?.focus();
      }, 0);
    };

    socket.onmessage = (e) => {
      finalOutput += e.data;
      setProgramOutput(prev => prev + e.data);

      if (!e.data.endsWith("\n")) {
        setWaitingForInput(true);
        terminalRef.current?.focus();
      }
    };

    socket.onclose = async () => {
      setWaitingForInput(false);
      setIsRunning(false);
      window.dispatchEvent(new Event("code-mania:terminal-inactive"));

      try {
        const result = await validateExercise(
          questId,
          finalOutput,
          code
        );

        console.log("Validation result:", result.objectives);

        if (result?.objectives) {
          setValidationResult(result.objectives);
        }

        if (result?.success) {
          window.dispatchEvent(
            new CustomEvent("code-mania:quest-complete", {
              detail: { questId }
            })
          );
        } else if (result?.message) {
          setProgramOutput(prev =>
            prev + "\n\n❌ " + result.message
          );
        }

      } catch (err) {
        setProgramOutput(prev =>
          prev + "\n\n❌ Validation server error"
        );
      }
    };
  };

  /* ===============================
     TERMINAL INPUT HANDLER
  =============================== */

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Always show typed text
      setProgramOutput(prev => prev + inputBuffer + "\n");

      // Only send to backend if container exists
      if (socketRef.current) {
        socketRef.current.send(
          JSON.stringify({ stdin: inputBuffer })
        );
      }

      setInputBuffer("");
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

  /* ===============================
     RUN BUTTON
  =============================== */

  const handleRun = () => {
    setProgramOutput("");
    setInputBuffer("");
    setWaitingForInput(false);
    setIsRunning(true);
    runViaDocker();
  };

  const totalObjectives = validationResult
    ? Object.keys(validationResult).length
    : 0;

  const passedObjectives = validationResult
    ? Object.values(validationResult).filter(obj => obj.passed).length
    : 0;

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
            className={`${styles["submit-btn"]} ${
                        !isQuestActive ? styles["btn-disabled"] : ""
                      }`}
            onClick={handleRun}
            disabled={isRunning || !isQuestActive}
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

        <div
            className={`${styles["terminal"]} ${!isRunning ? styles["terminal-disabled"] : ""}`}
            ref={terminalRef}
            tabIndex={isRunning ? 0 : -1}
            onClick={() => isRunning && terminalRef.current?.focus()}
            onKeyDown={handleKeyDown}
          >
        <div className={styles["terminal-header"]}>Terminal</div>

        <div className={styles["terminal-content"]}>
          <pre>
            {programOutput}
            {inputBuffer}
            <span className={styles.cursor}></span>
          </pre>
        </div>

      </div>
      {validationResult && (
          <div className={styles["validation-box"]}>
            <h4 className={styles["validation-summary"]}>
              Test Results: {passedObjectives} / {totalObjectives} passed
            </h4>

            {Object.values(validationResult).map((obj, index) => (
              <div
                key={index}
                className={
                  obj.passed
                    ? styles["test-pass"]
                    : styles["test-fail"]
                }
              >
                <span className={styles["test-icon"]}>
                  {obj.passed ? "✔" : "✖"}
                </span>
                <span>{obj.label}</span>
              </div>
            ))}

            {passedObjectives === totalObjectives && (
              <div className={styles["all-pass"]}>
                🎉 All tests passed!
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default InteractiveTerminal;