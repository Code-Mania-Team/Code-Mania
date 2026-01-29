import React from "react";
import Editor from "@monaco-editor/react";
import { Play } from "lucide-react";
import styles from "../styles/PythonExercise.module.css";

const CodeTerminal = ({
  code,
  onCodeChange,
  onRun,
  output,
  isRunning,
  showRunButton,
  disabled
}) => {
  const handleEditorMount = (editor) => {
    // 🔒 Pause game when editor focused
    editor.onDidFocusEditorText(() => {
      window.dispatchEvent(
        new CustomEvent("code-mania:terminal-active")
      );
    });

    // ▶ Resume game when editor blurred
    editor.onDidBlurEditorText(() => {
      window.dispatchEvent(
        new CustomEvent("code-mania:terminal-inactive")
      );
    });
  };

  return (
    <div className={styles["code-container"]}>
      <div className={styles["code-editor"]}>
        <div className={styles["editor-header"]}>
          <span>script.py</span>

          {showRunButton && (
            <button
              className={styles["submit-btn"]}
              onClick={onRun}
              disabled={disabled || isRunning}
            >
              <Play size={16} />
              {isRunning ? "Running..." : "Run"}
            </button>
          )}
        </div>

        <Editor
          height="300px"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={(v) => onCodeChange(v ?? "")}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2
          }}
        />
      </div>

      <div className={styles["terminal"]}>
        <div className={styles["terminal-header"]}>Terminal</div>
        <div className={styles["terminal-content"]}>
          <pre>{output || "Output will appear here..."}</pre>
        </div>
      </div>
    </div>
  );
};

export default CodeTerminal;
