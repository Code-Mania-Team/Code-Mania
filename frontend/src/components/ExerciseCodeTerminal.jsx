import React, { useEffect, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Play } from "lucide-react";
import styles from "../styles/PythonExercise.module.css";

const getMonacoLang = (lang) => {
  if (lang === "cpp") return "cpp";
  if (lang === "javascript") return "javascript";
  return "python";
};

const getFileName = (lang) => {
  if (lang === "cpp") return "main.cpp";
  if (lang === "javascript") return "script.js";
  return "script.py";
};

const ExerciseCodeTerminal = ({
  language = "python",
  code = "",
  onCodeChange,
  onRun,
  output = "",
  isRunning = false,
  showRunButton = true,
  disabled = false,
}) => {
  const terminalRef = useRef(null);
  const monacoLang = useMemo(() => getMonacoLang(language), [language]);

  useEffect(() => {
    const phaserContainer = document.getElementById("phaser-container");
    if (!phaserContainer) return;

    const handleGameFocus = () => {
      window.dispatchEvent(new Event("code-mania:terminal-inactive"));
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    };

    phaserContainer.addEventListener("pointerdown", handleGameFocus);

    return () => {
      phaserContainer.removeEventListener("pointerdown", handleGameFocus);
    };
  }, []);

  return (
    <div className={styles["code-container"]}>
      <div className={styles["code-editor"]}>
        <div className={styles["editor-header"]}>
          <span>{getFileName(language)}</span>

          {showRunButton && (
            <button
              className={`${styles["submit-btn"]} ${disabled ? styles["btn-disabled"] : ""}`}
              onClick={onRun}
              disabled={isRunning || disabled}
              type="button"
            >
              <Play size={16} />
              {isRunning ? "Running..." : "Run"}
            </button>
          )}
        </div>

        <Editor
          height="300px"
          language={monacoLang}
          theme="vs-dark"
          value={code}
          onChange={(value) => onCodeChange?.(value ?? "")}
          onMount={(editor) => {
            editor.onDidFocusEditorText(() => {
              window.dispatchEvent(new Event("code-mania:terminal-active"));
            });

            editor.onDidBlurEditorText(() => {
              window.dispatchEvent(new Event("code-mania:terminal-inactive"));
            });
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>

      <div className={styles["terminal"]} ref={terminalRef}>
        <div className={styles["terminal-header"]}>Terminal</div>
        <div className={styles["terminal-content"]}>
          <pre>{output || "▶ Output will appear here"}</pre>
        </div>
      </div>
    </div>
  );
};

export default ExerciseCodeTerminal;