import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { ArrowLeft, Play, Send, Sparkles } from "lucide-react";
import styles from "../styles/MonthlyChallengeCode.module.css";

function normalizeLanguage(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "js") return "javascript";
  if (v === "c++" || v === "cplusplus") return "cpp";
  if (v === "py") return "python";
  if (v === "python" || v === "cpp" || v === "javascript") return v;
  return "javascript";
}

function getMonacoLang(lang) {
  if (lang === "cpp") return "cpp";
  if (lang === "javascript") return "javascript";
  return "python";
}

function getFallbackStarterCode(lang) {
  if (lang === "cpp") {
    return `#include <bits/stdc++.h>
using namespace std;

int main() {
  // Write your solution here
  return 0;
}`;
  }
  if (lang === "python") {
    return `# Write your solution here
`;
  }
  return `// Write your solution here
`;
}

function normalizeTestCases(task) {
  const raw = task?.test_cases || task?.testCases || task?.tests || [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => ({
      input: t?.input ?? "",
      expected: t?.expected_output ?? t?.expectedOutput ?? t?.expected ?? "",
    }))
    .filter((t) => String(t.input).trim() || String(t.expected).trim());
}

export default function MonthlyChallengeCode() {
  const terminalWsUrl = import.meta.env.VITE_TERMINAL_WS_URL || "https://terminal.codemania.fun";
  const navigate = useNavigate();
  const { taskId } = useParams();
  const location = useLocation();

  const task = location.state?.task || null;
  const title = task?.title || `Weekly Challenge #${taskId || ""}`;
  const description = task?.description || "";
  const language = useMemo(
    () => normalizeLanguage(task?.language || task?.programming_language || task?.programmingLanguage),
    [task]
  );
  const testCases = useMemo(() => normalizeTestCases(task), [task]);

  const starter = useMemo(() => {
    const fromTask =
      task?.starter_code ??
      task?.starting_code ??
      task?.starterCode ??
      task?.startingCode ??
      "";
    const normalized = typeof fromTask === "string" ? fromTask : "";
    return normalized.trim() ? normalized : getFallbackStarterCode(language);
  }, [task, language]);

  const [code, setCode] = useState(starter);
  const [programOutput, setProgramOutput] = useState("");
  const [inputBuffer, setInputBuffer] = useState("");
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [submitBanner, setSubmitBanner] = useState("");

  const socketRef = useRef(null);
  const terminalRef = useRef(null);
  const terminalContentRef = useRef(null);

  useEffect(() => {
    setCode(starter);
  }, [starter]);

  useEffect(() => {
    if (terminalContentRef.current) {
      terminalContentRef.current.scrollTop = terminalContentRef.current.scrollHeight;
    }
  }, [programOutput, inputBuffer]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          // ignore
        }
        socketRef.current = null;
      }
    };
  }, []);

  const runViaDocker = () => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {
        // ignore
      }
    }

    setProgramOutput("");
    setInputBuffer("");
    setWaitingForInput(false);
    setIsRunning(true);

    const socket = new WebSocket(terminalWsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ language, code }));
      setTimeout(() => terminalRef.current?.focus(), 0);
    };

    socket.onmessage = (e) => {
      const chunk = e.data;
      setProgramOutput((prev) => prev + chunk);
      if (!String(chunk || "").endsWith("\n")) {
        setWaitingForInput(true);
        terminalRef.current?.focus();
      }
    };

    socket.onclose = () => {
      setWaitingForInput(false);
      setIsRunning(false);
    };

    socket.onerror = () => {
      setProgramOutput((prev) => prev + "\n❌ Connection error. Please try again.");
      setIsRunning(false);
    };
  };

  const handleKeyDown = (e) => {
    if (!isRunning || !waitingForInput) return;

    if (e.key === "Enter") {
      const value = inputBuffer;
      setProgramOutput((prev) => prev + value + "\n");
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({ stdin: value }));
      }
      setInputBuffer("");
      e.preventDefault();
      return;
    }

    if (e.key === "Backspace") {
      setInputBuffer((prev) => prev.slice(0, -1));
      e.preventDefault();
      return;
    }

    if (e.key.length === 1) {
      setInputBuffer((prev) => prev + e.key);
      e.preventDefault();
    }
  };

  const handleSubmit = () => {
    setSubmitBanner("Submission sent (visualization only).");
    runViaDocker();
    window.setTimeout(() => setSubmitBanner(""), 4000);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate("/freedomwall")}> 
          <ArrowLeft size={18} />
          Back
        </button>
        <div className={styles.headerTitleWrap}>
          <div className={styles.kicker}>
            <Sparkles size={16} />
            Weekly Challenge
          </div>
          <div className={styles.title} title={title}>{title}</div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.runBtn}
            onClick={runViaDocker}
            disabled={isRunning}
          >
            <Play size={16} />
            Run
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isRunning}
          >
            <Send size={16} />
            Submit
          </button>
        </div>
      </header>

      {submitBanner ? (
        <div className={styles.banner} role="status">{submitBanner}</div>
      ) : null}

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <section className={styles.card}>
            <div className={styles.cardTitle}>Problem</div>
            <div className={styles.cardText}>
              {description ? description : "(No description provided yet.)"}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardTitle}>Language</div>
            <div className={styles.pill}>{language.toUpperCase()}</div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardTitle}>Test Cases</div>
            {testCases.length ? (
              <div className={styles.tests}>
                {testCases.slice(0, 6).map((t, idx) => (
                  <div key={idx} className={styles.testRow}>
                    <div className={styles.testLabel}>#{idx + 1}</div>
                    <div className={styles.testBody}>
                      <div className={styles.testKey}>Input</div>
                      <pre className={styles.testPre}>{String(t.input)}</pre>
                      <div className={styles.testKey}>Expected</div>
                      <pre className={styles.testPre}>{String(t.expected)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.cardText}>(No test cases yet.)</div>
            )}
          </section>
        </aside>

        <main className={styles.main}>
          <div className={styles.editorPanel}>
            <div className={styles.panelTop}>
              <div className={styles.panelTopTitle}>Editor</div>
            </div>
            <div className={styles.editorWrap}>
              <Editor
                height="100%"
                language={getMonacoLang(language)}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  fontLigatures: true,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 14, bottom: 14 },
                  lineNumbersMinChars: 3,
                  renderLineHighlight: "all",
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>
          </div>

          <div className={styles.terminalPanel}>
            <div className={styles.panelTop}>
              <div className={styles.panelTopTitle}>Output</div>
            </div>
            <div
              className={styles.terminal}
              ref={terminalRef}
              tabIndex={isRunning ? 0 : -1}
              onClick={() => isRunning && terminalRef.current?.focus()}
              onKeyDown={handleKeyDown}
            >
              <div className={styles.terminalContent} ref={terminalContentRef}>
                {programOutput === "" && !isRunning ? (
                  <div className={styles.placeholder}>Run or submit to see output</div>
                ) : (
                  <pre className={styles.pre}>
                    {programOutput}
                    {waitingForInput ? (
                      <>
                        {inputBuffer}
                        <span className={styles.cursor}>▋</span>
                      </>
                    ) : null}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
