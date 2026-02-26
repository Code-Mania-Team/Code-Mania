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

const InteractiveTerminal = ({
  questId,
  mobileActivePanel,
  onMobilePanelChange,
  showMobilePanelSwitcher = true,
  enableMobileSplit = true,
  quest
}) => {
  const language = useMemo(getLanguageFromLocalStorage, []);
  const monacoLang = getMonacoLang(language);

  const [code, setCode] = useState(() => getStarterCode(language));
  const [programOutput, setProgramOutput] = useState("");
  const [inputBuffer, setInputBuffer] = useState("");
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isQuestActive, setIsQuestActive] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 900 : false
  );
  const [internalActivePanel, setInternalActivePanel] = useState("editor");

  const validateExercise = useValidateExercise();

  const socketRef = useRef(null);
  const terminalRef = useRef(null);
  const iframeRef = useRef(null);
  const useMobileSplit = isMobileView && enableMobileSplit;
  const [iframeContent, setIframeContent] = useState("");

  const activePanel = mobileActivePanel ?? internalActivePanel;
  const setActivePanel = (panel) => {
    if (onMobilePanelChange) onMobilePanelChange(panel);
    else setInternalActivePanel(panel);
  };

  useEffect(() => {
    console.log("Quest object:", quest);
  }, [quest]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    setActivePanel("editor");
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

      if (useMobileSplit) {
        setActivePanel("terminal");
      }
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
      const value = inputBuffer;
      setProgramOutput(prev => prev + value + "\n");
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({ stdin: value }));
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
    if (quest?.quest_type === "dom") {
      runDOM();
      setIsRunning(false);
  } else {
      runViaDocker();
      setIsRunning(true);
}
  };

  useEffect(() => {
    if (quest?.quest_type === "dom" && iframeRef.current) {
      // write content here
    }
  }, [quest, code]);
  
  // Need Validation for DOM
  const runDOM = () => {
  if (!quest) return;

  setIframeContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: sans-serif; padding: 12px; }
      </style>
    </head>
    <body>
      ${quest.base_html || ""}

      <script>
        // Wait for DOM to fully load
        window.addEventListener("load", function () {
          try {
            ${code}
          } catch (e) {
            const errorBox = document.createElement("pre");
            errorBox.style.color = "red";
            errorBox.style.whiteSpace = "pre-wrap";
            errorBox.textContent = e.toString();
            document.body.appendChild(errorBox);
          }
        });
      </script>
    </body>
    </html>
  `);
};

  useEffect(() => {
    if (quest?.quest_type === "dom") {
      setIframeContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 12px; }
          </style>
        </head>
        <body>
          ${quest?.base_html || ""}
        </body>
        </html>
      `);
      setCode(`
        /*
        Base HTML Structure:

        ${quest.base_html}
        */

        // Write your DOM code below 👇

      `);
    }
  }, [quest]);

  
  const handleSubmitInput = () => {
    const value = inputBuffer;
    setProgramOutput(prev => prev + value + "\n");
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ stdin: value }));
    }
    setInputBuffer("");
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
      {useMobileSplit && showMobilePanelSwitcher && (
        <div className={styles["mobile-panel-switcher"]}>
          <button
            type="button"
            className={`${styles["mobile-switch-btn"]} ${activePanel === "editor" ? styles["mobile-switch-btn-active"] : ""}`}
            onClick={() => setActivePanel("editor")}
          >
            Editor
          </button>
          <button
            type="button"
            className={`${styles["mobile-switch-btn"]} ${activePanel === "terminal" ? styles["mobile-switch-btn-active"] : ""}`}
            onClick={() => setActivePanel("terminal")}
          >
            Terminal
          </button>
        </div>
      )}

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

        {(!useMobileSplit || activePanel === "editor") && (
        <Editor
          height={isMobileView ? "240px" : "300px"}
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
        )}
      </div>

      {(!useMobileSplit || activePanel === "terminal") && (
        quest?.quest_type === "dom" ? (
          <iframe
            sandbox="allow-scripts"
            srcDoc={iframeContent}
            style={{
              width: "100%",
              height: "400px",
              border: "2px solid red",
              background: "white"
            }}
          />
        ) : (
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

          {isRunning && (
            <div className={styles["terminal-input-row"]}>
              <input
                className={styles["terminal-input"]}
                placeholder={waitingForInput ? "Type input and press Enter" : "Program running..."}
                value={inputBuffer}
                onChange={(e) => setInputBuffer(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmitInput();
                  }
                }}
                disabled={!waitingForInput}
              />
              <button
                type="button"
                className={styles["terminal-send-btn"]}
                onClick={handleSubmitInput}
                disabled={!waitingForInput}
              >
                Send
              </button>
            </div>
          )}
        </div>

      </div>
        )
      )}
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
