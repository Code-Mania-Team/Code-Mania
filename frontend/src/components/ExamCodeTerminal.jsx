import React, { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Play } from "lucide-react";
import styles from "../styles/ExamCodeTerminal.module.css";

function getMonacoLang(lang) {
  if (lang === "cpp") return "cpp";
  if (lang === "javascript") return "javascript";
  return "python";
}

function hasExecutionError(output, language) {
  const out = String(output || "");
  const patterns = [
    "Traceback",
    "SyntaxError",
    "NameError",
    "TypeError",
    "IndentationError",
    "ReferenceError",
    "fatal error",
    "undefined reference",
    "Segmentation fault",
    "error:",
  ];

  const lowered = out.toLowerCase();
  return patterns.some((p) => lowered.includes(String(p).toLowerCase()));
}

function coerceBool(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 1) return true;
  if (value === 0) return false;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no" || s === "") return false;
  }
  return Boolean(value);
}

const ExamCodeTerminal = ({ language, initialCode, attemptId, validateAttempt, submitAttempt, onResult, attemptNumber = 1, testCases = [], isAdmin = false, locked = false, isMobileView = false, mobilePanel = "code" }) => {
  const terminalWsUrl = import.meta.env.VITE_TERMINAL_WS_URL || "https://terminal.codemania.fun";
  const monacoLang = getMonacoLang(language);
  const [code, setCode] = useState(initialCode || "");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [inputBuffer, setInputBuffer] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [activeResultCaseIndex, setActiveResultCaseIndex] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState("terminal");
  const [lastSubmitResult, setLastSubmitResult] = useState(null);

  const formatCaseValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const formatOrEmpty = (value) => {
    const formatted = formatCaseValue(value);
    return formatted && String(formatted).trim() ? formatted : "(empty)";
  };

  const buildInputVarsForDisplay = (tc) => {
    const raw = tc && typeof tc === "object" ? tc : {};

    if (Array.isArray(raw.vars) && raw.vars.length) {
      return raw.vars
        .map((v) => ({ name: v?.name, value: v?.value }))
        .filter((v) => String(v.name || "").trim().length);
    }

    if (raw.input_vars && typeof raw.input_vars === "object" && !Array.isArray(raw.input_vars)) {
      return Object.entries(raw.input_vars).map(([name, value]) => ({ name, value }));
    }

    // If input isn't a string (e.g. JS structured cases), show it as a single value.
    if (raw.input !== null && raw.input !== undefined && typeof raw.input !== "string") {
      return [{ name: "input", value: raw.input }];
    }

    const stdin = String(raw.input ?? "");
    const lines = stdin.split(/\r?\n/);
    while (lines.length && lines[lines.length - 1] === "") lines.pop();
    if (!lines.length) return [];

    // Function-mode friendly display: if stdin is a single JSON value,
    // show args without the "args" wrapper.
    if (lines.length === 1) {
      const one = String(lines[0] ?? "").trim();
      const looksJson =
        (one.startsWith("{") && one.endsWith("}")) ||
        (one.startsWith("[") && one.endsWith("]"));

      if (looksJson) {
        try {
          const parsed = JSON.parse(one);

          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const args = Array.isArray(parsed.args) ? parsed.args : null;
            const kwargs = parsed.kwargs && typeof parsed.kwargs === "object" && !Array.isArray(parsed.kwargs)
              ? parsed.kwargs
              : null;

            if (args) {
              const out = args.map((v, i) => ({ name: `arg${i + 1}`, value: v }));
              if (kwargs) {
                Object.entries(kwargs).forEach(([k, v]) => out.push({ name: String(k), value: v }));
              }
              return out;
            }
          }

          if (Array.isArray(parsed)) {
            return parsed.map((v, i) => ({ name: `arg${i + 1}`, value: v }));
          }

          // Generic JSON object fallback.
          if (parsed && typeof parsed === "object") {
            return Object.entries(parsed).map(([name, value]) => ({ name, value }));
          }
        } catch {
          // fall through
        }
      }
    }

    const parseWarriorTrialInput = (allLines) => {
      const head = String(allLines[0] ?? "").trim();
      if (!/^\d+$/.test(head)) return null;
      const total = Number(head);
      if (!Number.isFinite(total) || total <= 0) return null;

      const rest = allLines.slice(1).map((l) => String(l ?? "").trim()).filter(Boolean);
      if (!rest.length) return null;

      const isYesNo = (v) => {
        const s = String(v || "").toLowerCase();
        return s === "yes" || s === "no";
      };
      const isInt = (v) => /^-?\d+$/.test(String(v ?? "").trim());

      // Format A: one value per line: name, age, strength, intelligence, armor
      const looksLikePerLine = rest.length === total * 5;
      if (looksLikePerLine) {
        const warriors = [];
        for (let i = 0; i < total; i += 1) {
          const base = i * 5;
          const name = rest[base];
          const age = rest[base + 1];
          const strength = rest[base + 2];
          const intelligence = rest[base + 3];
          const armor = rest[base + 4];

          if (!name || !isInt(age) || !isInt(strength) || !isInt(intelligence) || !isYesNo(armor)) {
            return null;
          }

          warriors.push({
            name,
            age: Number(age),
            strength: Number(strength),
            intelligence: Number(intelligence),
            armor: String(armor).toLowerCase(),
          });
        }

        if (total === 1) {
          const w = warriors[0];
          return [
            { name: "total_warriors", value: total },
            { name: "name", value: w.name },
            { name: "age", value: w.age },
            { name: "strength", value: w.strength },
            { name: "intelligence", value: w.intelligence },
            { name: "armor", value: w.armor },
          ];
        }

        return [
          { name: "total_warriors", value: total },
          { name: "warriors", value: warriors },
        ];
      }

      // Format B: one warrior per line: "name age strength intelligence armor"
      if (rest.length === total) {
        const warriors = [];
        for (let i = 0; i < total; i += 1) {
          const parts = rest[i].split(/\s+/);
          if (parts.length < 5) return null;
          const [name, age, strength, intelligence, armor] = parts;
          if (!name || !isInt(age) || !isInt(strength) || !isInt(intelligence) || !isYesNo(armor)) {
            return null;
          }
          warriors.push({
            name,
            age: Number(age),
            strength: Number(strength),
            intelligence: Number(intelligence),
            armor: String(armor).toLowerCase(),
          });
        }

        if (total === 1) {
          const w = warriors[0];
          return [
            { name: "total_warriors", value: total },
            { name: "name", value: w.name },
            { name: "age", value: w.age },
            { name: "strength", value: w.strength },
            { name: "intelligence", value: w.intelligence },
            { name: "armor", value: w.armor },
          ];
        }

        return [
          { name: "total_warriors", value: total },
          { name: "warriors", value: warriors },
        ];
      }

      return null;
    };

    const warriorVars = parseWarriorTrialInput(lines);
    if (warriorVars) return warriorVars;

    // Fallback: show stdin lines as "Line 1", "Line 2", ...
    return lines.map((line, idx) => ({ name: `Line ${idx + 1}`, value: line }));
  };
  const MAX_ATTEMPTS = 5;
  const attemptsExhausted = !isAdmin && attemptNumber >= MAX_ATTEMPTS;
  const [hasRunOnce, setHasRunOnce] = useState(false);

  useEffect(() => {
    // New attempt = require at least one Run again.
    setHasRunOnce(false);
  }, [attemptId, language]);

  const disableSubmit = isRunning || attemptsExhausted || locked || !hasRunOnce;
  const showEditor = !isMobileView || mobilePanel === "code";
  const showOutput = !isMobileView || mobilePanel === "output";
  const editorHeight = isMobileView ? "320px" : "430px";
  const testCasesCount = Array.isArray(testCases) ? testCases.length : 0;
  const terminalBodyRef = useRef(null);
  const terminalWrapRef = useRef(null);

  const socketRef = useRef(null);
  const outputRef = useRef("");

  useEffect(() => {
    const el = terminalBodyRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [output, inputBuffer]);

  useEffect(() => {
    if (testCasesCount === 0) {
      if (activeBottomTab === "cases") setActiveBottomTab("terminal");
    }
  }, [testCasesCount, activeBottomTab]);

  useEffect(() => {
    setActiveTestCaseIndex((prev) => {
      const max = Math.max(0, (testCases?.length || 1) - 1);
      return Math.min(prev, max);
    });
  }, [testCases?.length]);

  useEffect(() => {
    setActiveResultCaseIndex((prev) => {
      const max = Math.max(0, (testCases?.length || 1) - 1);
      return Math.min(prev, max);
    });
  }, [testCases?.length]);

  const visibleResultCaseIndices = useMemo(() => {
    const casesArr = Array.isArray(testCases) ? testCases : [];
    const out = [];
    for (let i = 0; i < casesArr.length; i += 1) {
      const tc = casesArr[i];
      const hidden = coerceBool(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden);
      if (!hidden) out.push(i);
    }
    return out;
  }, [testCases]);

  const hiddenResultCaseCount = useMemo(() => {
    const total = Array.isArray(testCases) ? testCases.length : 0;
    return Math.max(0, total - visibleResultCaseIndices.length);
  }, [testCases, visibleResultCaseIndices]);

  useEffect(() => {
    // Keep the result tab focused on a visible (non-hidden) case like LeetCode.
    if (!visibleResultCaseIndices.length) return;
    if (visibleResultCaseIndices.includes(activeResultCaseIndex)) return;
    setActiveResultCaseIndex(visibleResultCaseIndices[0]);
  }, [activeResultCaseIndex, visibleResultCaseIndices]);

  useEffect(() => {
    setCode(initialCode || "");
  }, [initialCode]);

  // Intentionally do not persist exam/quiz code in localStorage.

  /* ===============================
     TERMINAL WRITE
  =============================== */
  const write = (text) => {
    outputRef.current += text;
    setOutput(outputRef.current);
  };

  const resetTerminal = () => {
    try {
      socketRef.current?.close();
    } catch {
      // ignore
    }
    socketRef.current = null;
    outputRef.current = "";
    setOutput("");
    setInputBuffer("");
  };

  /* ===============================
     RUN (WS CONNECT)
  =============================== */
  const handleRun = async () => {
    if (isRunning) return;

    setHasRunOnce(true);
    resetTerminal();
    setIsRunning(true);

    // If the caller provides a validator (quiz/exam), run visible tests here.
    if (typeof validateAttempt === "function") {
      write("\n⏳ Validating test cases...\n");

      try {
        const result = await validateAttempt(code, language);

        if (!result) {
          write("\n❌ Validation failed\n");
          return;
        }

        setLastSubmitResult(result);
        setTestResults(Array.isArray(result?.results) ? result.results : []);
        setActiveResultCaseIndex((prev) => {
          if (visibleResultCaseIndices.length) return visibleResultCaseIndices[0];
          return Math.max(0, Math.min(prev, Math.max(0, (testCases?.length || 1) - 1)));
        });
        setActiveBottomTab("result");

        write("\n=== VALIDATION (TESTS) ===\n");
        if (typeof result.score_percentage === "number") {
          write(`Score: ${result.score_percentage}%\n`);
        }
        if (typeof result.passed === "boolean") {
          write(`Passed: ${result.passed ? "YES" : "NO"}\n`);
        }
        write("================================\n\n");
      } catch (err) {
        console.error("Validation error:", err);
        write("\n❌ Error while validating\n");
      } finally {
        write("\n▶ Ready for Execution\n");
        setIsRunning(false);
      }

      return;
    }

    // Fallback: interactive WS "Run".
    // Ensure keystrokes go to the terminal for stdin.
    setTimeout(() => {
      try {
        terminalWrapRef.current?.focus();
      } catch {
        // ignore
      }
    }, 0);

    let hadSocketError = false;
    let gotAnyOutput = false;

    const socket = new WebSocket(terminalWsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          language,
          code
        })
      );

      // Some programs call input("") and print no prompt.
      // If we see no output shortly after start, assume waiting for stdin.
      setTimeout(() => {
        if (!gotAnyOutput && socketRef.current === socket) {
          // stdin input field is always visible while running
        }
      }, 250);
    };

    socket.onmessage = (e) => {
      const text = e.data;
      gotAnyOutput = true;
      write(text);

      terminalWrapRef.current?.focus();

      // If output doesn't end with newline,
      // assume program is waiting for input
      if (!text.endsWith("\n")) {
        // stdin input field is always visible while running
      }
    };

    socket.onclose = () => {
      setIsRunning(false);

      if (hadSocketError) return;

      const sep = outputRef.current && !outputRef.current.endsWith("\n") ? "\n" : "";
      const ok = !hasExecutionError(outputRef.current, language);
      write(`${sep}\n=== ${ok ? "Code Execution Successful" : "Code Execution Finished (with errors)"} ===\n`);
    };

    socket.onerror = () => {
      hadSocketError = true;
      write("\n❌ Connection error\n");
      setIsRunning(false);
    };
  };

  const handleSubmit = async () => {
    if (isRunning || !attemptId || locked) return;

    resetTerminal();
    write("\n⏳ Running some tests...\n");
    setIsRunning(true);

    try {
      const result = await submitAttempt(code, language);

      if (!result) {
        write("\n❌ Submission failed\n");
        setIsRunning(false);
        return;
      }
      if (result.score_percentage === 100 && !result?.practice_run) {
        localStorage.removeItem(storageKey);
      }

      setLastSubmitResult(result);
      setTestResults(Array.isArray(result?.results) ? result.results : []);
      setActiveResultCaseIndex((prev) => {
        if (visibleResultCaseIndices.length) return visibleResultCaseIndices[0];
        return Math.max(0, Math.min(prev, Math.max(0, (testCases?.length || 1) - 1)));
      });

      write("\n=== EXAM RESULT ===\n");
      write(`Score: ${result.score_percentage}%\n`);
      write(`Passed: ${result.passed ? "YES" : "NO"}\n`);
      write("====================\n\n");

      if (result.results) {
        result.results.forEach((r) => {
          write(
            `Test ${r.test_index}: ${r.passed ? "✅ Passed" : "❌ Failed"
            } (${r.execution_time_ms}ms)\n`
          );
        });
      }

      // Show congratulations message if perfect score
      if (result.score_percentage === 100 && !result?.practice_run) {
        write("\n🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉\n");
        write("   🏆 PERFECT SCORE! ALL TESTS PASSED!\n");
        write("   Congratulations, you earned a badge!\n");
        write("🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉\n");
      }

      onResult?.(result);

    } catch (err) {
      console.error("Submission error:", err);
      write("\n❌ Error while running tests\n");
    } finally {
      write("\n▶ Ready for Execution\n");
      setIsRunning(false);
    }
  };

  const normalizeResultRow = (row, fallbackIndex) => {
    const r = row && typeof row === "object" ? row : {};
    const idxRaw = r.test_index ?? r.testIndex ?? fallbackIndex + 1;

    const isHidden = coerceBool(r.is_hidden ?? r.isHidden ?? r.hidden);

    const expected = isHidden
      ? ""
      : (r.expected ?? r.expected_output ?? r.expectedOutput ?? r.exp ?? "");

    const output = isHidden
      ? ""
      : (r.stdout_display ??
        r.stdoutDisplay ??
        r.output ??
        r.stdout ??
        r.actual_output ??
        r.actualOutput ??
        r.actual ??
        r.result ??
        "");

    const runtimeMs =
      typeof r.execution_time_ms === "number"
        ? r.execution_time_ms
        : typeof r.runtime_ms === "number"
          ? r.runtime_ms
          : typeof r.time_ms === "number"
            ? r.time_ms
            : null;

    return {
      test_index: Number(idxRaw) || fallbackIndex + 1,
      passed: Boolean(r.passed),
      output: output === undefined ? "" : output,
      expected: expected === undefined ? "" : expected,
      runtimeMs,
      isHidden,
    };
  };

  const resultsByIndex = useMemo(() => {
    const map = new Map();
    (testResults || []).forEach((row, i) => {
      const norm = normalizeResultRow(row, i);
      map.set(norm.test_index, norm);
    });
    return map;
  }, [testResults]);

  /* ===============================
     HANDLE USER INPUT
  =============================== */
  const handleKeyDown = (e) => {
    if (!socketRef.current || !isRunning) return;

    if (e.key === "Enter") {
      socketRef.current.send(JSON.stringify({ stdin: inputBuffer }));
      write(inputBuffer + "\n");
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

  return (
    <div className={styles.examCodeContainer}>
      {showEditor && (
      <div className={styles.examCodeEditor}>
        <div className={styles.examEditorHeader}>
          <span>
            {language === "cpp"
              ? "main.cpp"
              : language === "javascript"
                ? "main.js"
                : "script.py"}
          </span>

          <div className={styles.examEditorActions}>
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
              title={!hasRunOnce ? "Run once to enable Submit" : undefined}
              style={{
                background: disableSubmit ? "#475569" : "#10b981",
                cursor: disableSubmit ? "not-allowed" : "pointer",
                opacity: disableSubmit ? 0.6 : 1
              }}
              onClick={handleSubmit}
            >
              {attemptsExhausted
                ? "No Attempts Left"
                : "Submit"}
            </button>
          </div>
        </div>

        <Editor
          height={editorHeight}
          language={monacoLang}
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            contextmenu: false,
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
          }}
        />
      </div>
      )}

      {showOutput && (
        <div 
          className={styles.examBottomSection}
          style={{ marginTop: showEditor ? "1.5rem" : "0" }}
        >
          <div
            className={styles.examTerminal}
            ref={terminalWrapRef}
            onClick={() => {
              if (activeBottomTab !== "terminal") return;
              terminalWrapRef.current?.focus();
            }}
            tabIndex={activeBottomTab === "terminal" ? 0 : -1}
            onKeyDown={activeBottomTab === "terminal" ? handleKeyDown : undefined}
            style={{
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 15px 50px rgba(0,0,0,0.45)",
              background: "linear-gradient(180deg, #0b1220, #070f1c)",
            }}
          >
            {/* HEADER */}
            <div className={styles.examTerminalHeader}>
              <div className={styles.examTerminalTabs} role="tablist" aria-label="Exam output tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeBottomTab === "terminal"}
                  className={`${styles.examTerminalTab} ${activeBottomTab === "terminal" ? styles.examTerminalTabActive : ""}`}
                  onClick={() => setActiveBottomTab("terminal")}
                >
                  Terminal
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeBottomTab === "cases"}
                  className={`${styles.examTerminalTab} ${activeBottomTab === "cases" ? styles.examTerminalTabActive : ""}`}
                  onClick={() => setActiveBottomTab("cases")}
                  disabled={testCasesCount === 0}
                  title={testCasesCount === 0 ? "No test cases" : undefined}
                >
                  Test Cases
                  {testCasesCount ? <span className={styles.examTerminalTabCount}>{testCasesCount}</span> : null}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeBottomTab === "result"}
                  className={`${styles.examTerminalTab} ${activeBottomTab === "result" ? styles.examTerminalTabActive : ""}`}
                  onClick={() => setActiveBottomTab("result")}
                  disabled={!lastSubmitResult}
                  title={!lastSubmitResult ? "Submit to see results" : undefined}
                >
                  Test Result
                </button>
              </div>

              <span
                className={styles.examTerminalStatus}
                style={{
                  background: isRunning ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.15)",
                  color: isRunning ? "#3b82f6" : "#22c55e"
                }}
              >
                {isRunning ? "Running..." : "Idle"}
              </span>
            </div>

            {/* BODY */}
            <div className={styles.examTerminalBody}>
              {activeBottomTab === "terminal" && (
                <div ref={terminalBodyRef} className={styles.examTerminalScroll}>
                  <pre style={{ margin: 0, color: "#cbd5e1" }}>
                    {output}

                    {isRunning && (
                      <>
                        <span style={{ color: "#22c55e" }}>›</span>{" "}
                        <span style={{ color: "#22c55e" }}>{inputBuffer}</span>
                        <span style={{ color: "#22c55e" }}>|</span>
                      </>
                    )}

                    {!output && !isRunning && (
                      <span style={{ color: "#22c55e", opacity: 0.7 }}>
                        ▶ Ready for Execution
                      </span>
                    )}
                  </pre>
                </div>
              )}

              {activeBottomTab === "cases" && (
                <div className={styles.examTabPanel} role="tabpanel">
                  <div className={styles.examTestCaseBody}>
                    <div className={styles.examTestTabs} role="tablist" aria-label="Exam test cases">
                      {(testCases || []).map((tc, idx) => {
                        const isActive = idx === activeTestCaseIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`${styles.examTestTab} ${isActive ? styles.examTestTabActive : ""}`}
                            onClick={() => setActiveTestCaseIndex(idx)}
                            role="tab"
                            aria-selected={isActive}
                          >
                            Case {idx + 1}
                            {Boolean(tc?.is_hidden ?? tc?.isHidden) ? (
                              <span className={styles.examTestTabDot} title="Hidden" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {(() => {
                      const tc = (testCases || [])[activeTestCaseIndex] || {};
                      return (
                        <div className={styles.examTestPanel} role="tabpanel">
                            <div className={styles.examTestPanelHead}>
                              <div className={styles.examTestPanelTitle}>Case {activeTestCaseIndex + 1}</div>
                              {Boolean(tc?.is_hidden ?? tc?.isHidden) ? (
                                <span className={styles.examTestCaseBadge}>Hidden</span>
                              ) : null}
                            </div>

                          <div>
                            <div className={styles.examTestCaseLabel}>Input</div>
                            {(() => {
                              const vars = buildInputVarsForDisplay(tc);
                              if (vars.length) {
                                return (
                                  <div className={styles.caseVars}>
                                    {vars.map((v, i) => (
                                      <div key={`${v.name}-${i}`} className={styles.caseVar}>
                                        <div className={styles.caseVarLabel}>
                                          <span className={styles.caseVarName}>{String(v.name)}</span>
                                          <span className={styles.caseVarEq}>=</span>
                                        </div>
                                        <div className={styles.caseVarValue}>{formatOrEmpty(v.value)}</div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }

                              return <div className={styles.examTestCaseValue}>{formatOrEmpty(tc.input)}</div>;
                            })()}
                          </div>

                          <div>
                            <div className={styles.examTestCaseLabel}>Expected Output</div>
                            <div className={styles.examTestCaseValue}>
                              {formatOrEmpty(tc?.expected ?? tc?.output ?? tc?.expected_output ?? tc?.expectedOutput)}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {activeBottomTab === "result" && (
                <div className={styles.examTabPanel} role="tabpanel">
                  {!lastSubmitResult ? (
                    <div className={styles.examEmptyPanel}>Submit to validate.</div>
                  ) : (
                    (() => {
                      const total = Array.isArray(testCases) ? testCases.length : 0;
                      const activeTc = (testCases || [])[activeResultCaseIndex] || {};
                      const activeTestIndex = activeResultCaseIndex + 1;
                      const rawRowByOrder = (testResults || [])[activeResultCaseIndex];
                      const r =
                        resultsByIndex.get(activeTestIndex) ||
                        normalizeResultRow(rawRowByOrder || null, activeResultCaseIndex);

                      const hasStdoutField = (() => {
                        const row = rawRowByOrder && typeof rawRowByOrder === "object" ? rawRowByOrder : null;
                        if (!row) return false;
                        return (
                          "output" in row ||
                          "stdout" in row ||
                          "actual_output" in row ||
                          "actualOutput" in row ||
                          "result" in row ||
                          "actual" in row
                        );
                      })();
                      const accepted = Boolean(lastSubmitResult?.passed) || Number(lastSubmitResult?.score_percentage || 0) === 100;

                      const runtimeMs = (() => {
                        const all = (testResults || [])
                          .map((row, i) => normalizeResultRow(row, i))
                          .map((x) => x.runtimeMs)
                          .filter((x) => typeof x === "number");
                        if (!all.length) return null;
                        return all.reduce((a, b) => a + b, 0);
                      })();

                      const safeInputHidden = coerceBool(activeTc?.is_hidden ?? activeTc?.isHidden ?? r.isHidden);
                      const safeExpected = safeInputHidden
                        ? "Hidden"
                        : (() => {
                          const fromRunner = r?.expected;
                          if (typeof fromRunner === "string" && fromRunner.trim()) return formatOrEmpty(fromRunner);
                          return formatOrEmpty(activeTc?.expected ?? activeTc?.output ?? activeTc?.expected_output ?? activeTc?.expectedOutput);
                        })();

                      return (
                        <div className={styles.resultWrap}>
                          <div className={styles.resultTop}>
                            <div className={styles.resultVerdictRow}>
                              <div className={`${styles.resultVerdict} ${accepted ? styles.resultVerdictOk : styles.resultVerdictBad}`}
                              >
                                {accepted ? "Accepted" : "Not Accepted"}
                              </div>
                              <div className={styles.resultRuntime}>
                                Runtime: {typeof runtimeMs === "number" ? `${runtimeMs} ms` : "-"}
                              </div>
                            </div>

                            <div className={styles.resultCaseTabs} role="tablist" aria-label="Result test cases">
                              {(visibleResultCaseIndices.length ? visibleResultCaseIndices : []).map((origIdx, visibleIdx) => {
                                const testIndex = origIdx + 1;
                                const row = resultsByIndex.get(testIndex);
                                const passed = Boolean(row?.passed);
                                const isActive = origIdx === activeResultCaseIndex;
                                return (
                                  <button
                                    key={testIndex}
                                    type="button"
                                    className={`${styles.resultCaseTab} ${isActive ? styles.resultCaseTabActive : ""}`}
                                    onClick={() => setActiveResultCaseIndex(origIdx)}
                                    role="tab"
                                    aria-selected={isActive}
                                  >
                                    <span
                                      className={`${styles.resultCaseIcon} ${passed ? styles.resultCaseIconOk : styles.resultCaseIconBad}`}
                                    />
                                    Case {visibleIdx + 1}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className={styles.resultSection}>
                            <div className={styles.resultLabel}>Input</div>
                            {safeInputHidden ? (
                              <div className={styles.resultBox}>(Hidden test case)</div>
                            ) : (
                              <div className={styles.resultVarsWrap}>
                                {(() => {
                                  const vars = buildInputVarsForDisplay(activeTc);
                                  if (!vars.length) return <div className={styles.resultBox}>(empty)</div>;
                                  return (
                                    <div className={styles.caseVars}>
                                      {vars.map((v, i) => (
                                        <div key={`${v.name}-${i}`} className={styles.caseVar}>
                                          <div className={styles.caseVarLabel}>
                                            <span className={styles.caseVarName}>{String(v.name)}</span>
                                            <span className={styles.caseVarEq}>=</span>
                                          </div>
                                          <div className={styles.caseVarValue}>{formatOrEmpty(v.value)}</div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          <div className={styles.resultSection}>
                            <div className={styles.resultLabel}>Stdout</div>
                            <div className={styles.resultBox}>
                              {safeInputHidden
                                ? "Hidden"
                                : String(formatOrEmpty(r.output)) === "(empty)" && !hasStdoutField
                                  ? "(Runner did not return stdout for this case)"
                                  : formatOrEmpty(r.output)}
                            </div>
                          </div>

                          <div className={styles.resultSection}>
                            <div className={styles.resultLabel}>Expected</div>
                            <div className={styles.resultBox}>{safeExpected}</div>
                          </div>

                          <div className={styles.resultRuntime}>
                            Visible cases: {visibleResultCaseIndices.length} • Hidden cases: {hiddenResultCaseCount}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>


  );
};

export default ExamCodeTerminal;
