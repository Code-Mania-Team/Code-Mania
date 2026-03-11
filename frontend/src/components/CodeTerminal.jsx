import React, { useRef, useState, useMemo, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Check } from "lucide-react";
import styles from "../styles/PythonExercise.module.css";
import useValidateExercise from "../services/validateExercise";
import useCreateDomSession from "../services/useCreateDomSession";
import useUpdateDomSession from "../services/useUpdateDomSession";
import useDeleteDomSession from "../services/useDeleteDomSession";
import useValidateDom from "../services/useValidateDom";

/* ===============================
   LANGUAGE DETECTION
=============================== */

function getLanguageFromLocalStorage() {
  const title = (localStorage.getItem("lastCourseTitle") || "").toLowerCase();
  if (title.includes("javascript")) return "javascript";
  if (title.includes("c++")) return "cpp";
  return "python";
}

function normalizeLanguage(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "c++" || normalized === "cpp") return "cpp";
  if (normalized === "javascript" || normalized === "js") return "javascript";
  if (normalized === "python" || normalized === "py") return "python";
  return null;
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

function hasExecutionError(output, language) {
  const errorPatterns = [
    "Traceback",              // Python
    "SyntaxError",
    "NameError",
    "TypeError",
    "IndentationError",

    "ReferenceError",         // JS
    "TypeError:",
    "SyntaxError:",

    "error:",                 // C++
    "undefined reference",
    "Segmentation fault",
    "fatal error"
  ];

  return errorPatterns.some(pattern =>
    output.toLowerCase().includes(pattern.toLowerCase())
  );
}

function normalizeTestResults(result) {
  const candidates = [
    result?.test_results,
    result?.test_result,
    result?.data?.test_results,
    result?.data?.test_result,
  ];

  for (const item of candidates) {
    if (Array.isArray(item)) return item;
    if (item && typeof item === "object") return Object.values(item);
  }

  return [];
}

const InteractiveTerminal = ({
  quest,
  questId,
  mobileActivePanel,
  onMobilePanelChange,
  showMobilePanelSwitcher = true,
  enableMobileSplit = true
}) => {
  const language = useMemo(() => {
    const fromQuest =
      normalizeLanguage(quest?.programming_languages?.slug) ||
      normalizeLanguage(quest?.programming_languages?.name);

    return fromQuest || getLanguageFromLocalStorage();
  }, [quest]);
  const terminalWsUrl = import.meta.env.VITE_TERMINAL_WS_URL || "https://terminal.codemania.fun";
  const monacoLang = getMonacoLang(language);
  const resolveInitialCode = () => {
    const dbStartingCode = typeof quest?.starting_code === "string" ? quest.starting_code : "";
    if (dbStartingCode.trim()) return dbStartingCode;
    return getStarterCode(language);
  };

  const [code, setCode] = useState(() => resolveInitialCode());
  const [programOutput, setProgramOutput] = useState("");
  const [inputBuffer, setInputBuffer] = useState("");
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [isQuestActive, setIsQuestActive] = useState(false);
  const [isQuestCompleted, setIsQuestCompleted] = useState(false);
  const [failedSubmissions, setFailedSubmissions] = useState(0);
  const [isValidationCollapsed, setIsValidationCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 900 : false
  );
  const [domSessionId, setDomSessionId] = useState(null);
  const [sandboxUrl, setSandboxUrl] = useState(null);
  const [internalActivePanel, setInternalActivePanel] = useState("editor");

  const validateExercise = useValidateExercise();
  const validateDom = useValidateDom();

  const createDomSession = useCreateDomSession();
  const updateDomSession = useUpdateDomSession();
  const deleteDomSession = useDeleteDomSession();
  const socketRef = useRef(null);
  const terminalRef = useRef(null);
  const iframeRef = useRef(null);
  const useMobileSplit = isMobileView && enableMobileSplit;
  

  const activePanel = mobileActivePanel ?? internalActivePanel;
  const isBusy = isRunning || isSubmitting;
  const setActivePanel = (panel) => {
    if (onMobilePanelChange) onMobilePanelChange(panel);
    else setInternalActivePanel(panel);
  };

  useEffect(() => {
  }, [quest]);

  useEffect(() => {
    if (!quest || quest.quest_type !== "dom") return;

    const initSession = async () => {
      const result = await createDomSession({
        questId: quest.id,
        baseHtml: quest.base_html
      });

      if (result.success) {
        setDomSessionId(result.data.sessionId);
        setSandboxUrl(result.data.sandboxUrl);
      }
    };

    initSession();
  }, [quest]);

  useEffect(() => {
    return () => {
      if (domSessionId) {
        deleteDomSession(domSessionId).catch(() => {});
      }
    };
  }, [domSessionId]);

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
      if (startedId === questId && !isQuestCompleted) {
        setIsQuestActive(true);
      }
    };

    const handleQuestComplete = (e) => {
      const completedId = e.detail?.questId;
      if (String(completedId) === String(questId)) {
        setIsQuestCompleted(true);
        setIsQuestActive(false);
        setIsRunning(false);
        setIsSubmitting(false);
        setWaitingForInput(false);
        terminalRef.current?.blur();
      }
    };

    window.addEventListener("code-mania:quest-started", handleQuestStarted);
    window.addEventListener("code-mania:quest-complete", handleQuestComplete);

    return () => {
      window.removeEventListener("code-mania:quest-started", handleQuestStarted);
      window.removeEventListener("code-mania:quest-complete", handleQuestComplete);
    };
  }, [isQuestCompleted, questId]);

  useEffect(() => {
    setIsQuestActive(false);
    setIsQuestCompleted(false);
    setTestResults(null);
    setIsSubmitting(false);
    setIsRunning(false);
    setWaitingForInput(false);
    setValidationResult(null);
    setFailedSubmissions(0);
    setCode(resolveInitialCode());
    setActivePanel("editor");
    setIsValidationCollapsed(false);
  }, [questId, quest?.starting_code]);

  const hasAnyResults =
    Boolean(validationResult) || (Array.isArray(testResults) && testResults.length > 0);

  useEffect(() => {
    if (hasAnyResults) setIsValidationCollapsed(false);
  }, [hasAnyResults]);

  const progressiveHints = useMemo(() => {
    const questHints = Array.isArray(quest?.hints)
      ? quest.hints.filter((hint) => typeof hint === "string" && hint.trim())
      : [];

    const dbHints =
      quest?.hints && typeof quest.hints === "object" && !Array.isArray(quest.hints)
        ? quest.hints
        : null;

    const requirements = Array.isArray(quest?.requirements)
      ? quest.requirements
          .map((item) => item?.label)
          .filter((label) => typeof label === "string" && label.trim())
      : [];

    const concept =
      dbHints?.concept ||
      questHints[0] ||
      requirements[0] ||
      "Review the problem statement and identify the key concept first.";

    const structure =
      dbHints?.structure ||
      questHints[1] ||
      "Build your solution step by step: input, processing logic, then output.";

    const nearSolution =
      dbHints?.nearSolution ||
      questHints[2] ||
      "You are close - double-check operators, variable names, and exact output format.";

    return [
      { level: "Concept clue", text: concept },
      { level: "Structure clue", text: structure },
      { level: "Near-solution clue", text: nearSolution },
    ];
  }, [quest]);

  const unlockedHintCount = Math.min(3, Math.max(0, failedSubmissions - 1));


  const runViaDocker = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    let finalOutput = ""; // prevent stale state issue

    const socket = new WebSocket(terminalWsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      window.dispatchEvent(new Event("code-mania:terminal-active"));
      socket.send(JSON.stringify({ language, code }));

      // Allow typing immediately; stdin can be buffered by the process.
      setWaitingForInput(true);

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

      // Keep stdin enabled; relying on newline heuristics breaks for
      // programs that wait for input after printing a full line.
      setWaitingForInput(true);
      terminalRef.current?.focus();
    };

    socket.onclose = async () => {
      setWaitingForInput(false);
      setIsRunning(false);
      window.dispatchEvent(new Event("code-mania:terminal-inactive"));
    };

    socket.onerror = () => {
      setProgramOutput(prev => prev + "\nConnection error. Please try again.\n");
      setIsRunning(false);
      setWaitingForInput(false);
      window.dispatchEvent(new Event("code-mania:terminal-inactive"));
    };
  };

  const executeCodeForValidation = () =>
    new Promise((resolve) => {
      let finalOutput = "";
      const socket = new WebSocket(terminalWsUrl);

      socket.onopen = () => {
        socket.send(JSON.stringify({ language, code }));
      };

      socket.onmessage = (e) => {
        finalOutput += e.data;
      };

      socket.onclose = () => {
        resolve(finalOutput);
      };

      socket.onerror = () => {
        try {
          socket.close();
        } catch {
          null;
        }
        resolve("");
      };
    });

  /* ===============================
     RUN BUTTON
  =============================== */

  const handleSubmit = async () => {
    if (!quest || !isQuestActive || isQuestCompleted || isRunning || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const outputForValidation = await executeCodeForValidation();
      
      // Check for execution errors before validating
      if (hasExecutionError(outputForValidation, language)) {
        return;
      }

      const result = await validateExercise(
        questId,
        outputForValidation,
        code
      );
      if (result?.objectives) {
        setValidationResult(result.objectives);
      }

      setTestResults(normalizeTestResults(result));

      if (result?.success) {
        setFailedSubmissions(0);
        window.dispatchEvent(
          new CustomEvent("code-mania:quest-complete", {
            detail: { questId }
          })
        );
      } else {
        setFailedSubmissions((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRun = () => {
    if (isSubmitting) return;

    setProgramOutput("");
    setInputBuffer("");
    setWaitingForInput(false);
    if (quest?.quest_type === "dom") {
      runDOM();
      setIsRunning(false);
    } else {
      setIsRunning(true);
      runViaDocker();
    }
  };

  useEffect(() => {
    if (quest?.quest_type === "dom" && iframeRef.current) {
      // write content here
    }
  }, [quest, code]);
  
  // Need Validation for DOM
  const runDOM = async () => {
    if (!domSessionId) return;
    setIsRunning(true);
    try {
      await updateDomSession(domSessionId, code);

      // Force iframe reload
      setSandboxUrl(prev => `${prev.split("?")[0]}?t=${Date.now()}`);

    } catch (err) {
      console.error("DOM run error:", err);
    }

    setIsRunning(false);
  };

  const handleSubmitDom = async () => {
    if (!domSessionId || isSubmitting || isRunning) return;

    setIsSubmitting(true);

    try {
      const result = await validateDom(domSessionId, quest.requirements);

      if (result.success) {
        setValidationResult(result.data.objectives);

        if (result.data.passed) {
          setFailedSubmissions(0);
          window.dispatchEvent(
            new CustomEvent("code-mania:quest-complete", {
              detail: { questId }
            })
          );
        } else {
          setFailedSubmissions((prev) => prev + 1);
        }
      }

    } catch (err) {
      console.error("DOM validation failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handleSubmitInput = () => {
    const value = inputBuffer;
    setProgramOutput(prev => prev + value + "\n");
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ stdin: value }));
    }
    setInputBuffer("");
  };

  const handleKeyDown = (e) => {
    if (!isQuestActive || isQuestCompleted || !isRunning) {
      return;
    }

    if (e.key === "Enter") {
      handleSubmitInput();
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

  const totalObjectives = validationResult
  ? Object.keys(validationResult).length
  : 0;

  const passedObjectives = validationResult
    ? Object.values(validationResult).filter(obj => obj.passed).length
    : 0;

  const totalRuntimeTests = Array.isArray(testResults) ? testResults.length : 0;
  const passedRuntimeTests = Array.isArray(testResults)
    ? testResults.filter((t) => t?.passed).length
    : 0;

  const totalChecks = totalObjectives + totalRuntimeTests;
  const passedChecks = passedObjectives + passedRuntimeTests;

  /* ===============================
     RENDER
  =============================== */

  return (
    <div className={`${styles["code-container"]} ${!isQuestActive || isQuestCompleted ? styles["code-container-locked"] : ""}`}>
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

      {(!useMobileSplit || activePanel === "editor") && (
      <div className={styles["code-editor"]}>
        <div className={styles["editor-header"]}>
          <span>
            {language === "cpp"
              ? "main.cpp"
              : language === "javascript"
              ? "script.js"
              : "script.py"}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`${styles["submit-btn"]} ${
                        !isQuestActive || isQuestCompleted ? styles["btn-disabled"] : ""
                      }`}
              onClick={handleRun}
              disabled={isRunning || isSubmitting || !isQuestActive || isQuestCompleted}
              title="Test your code and see the output"
            >
              <Play size={16} />
              {isRunning ? "Running..." : "Run"}
            </button>
            <button
              className={`${styles["submit-btn"]} ${
                        !isQuestActive || isQuestCompleted ? styles["btn-disabled"] : ""
                      }`}
              onClick={quest?.quest_type === "dom" ? handleSubmitDom : handleSubmit}
              disabled={isRunning || isSubmitting || !isQuestActive || isQuestCompleted}
              title="Submit your solution to complete the quest"
            >
              <Check size={16} />
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        <Editor
          height={isMobileView ? "240px" : "300px"}
          language={monacoLang}
          theme="vs-dark"
          value={code}
          onChange={(v) => {
            if (!isQuestActive || isQuestCompleted) return;
            setCode(v ?? "");
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            readOnly: !isQuestActive || isQuestCompleted
          }}
        />
      </div>
      )}

      {(!useMobileSplit || activePanel === "terminal") && (
        quest?.quest_type === "dom" ? (
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            src={sandboxUrl}
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
            tabIndex={isRunning && isQuestActive && !isQuestCompleted ? 0 : -1}
            onClick={() => isRunning && isQuestActive && !isQuestCompleted && terminalRef.current?.focus()}
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
      ))}
       {hasAnyResults && (
         <div
           className={`${styles["validation-box"]} ${isValidationCollapsed ? styles["validation-box-collapsed"] : ""}`}
         >
           <div className={styles["validation-header"]}>
             <div className={styles["validation-title"]}>
               {totalChecks > 0
                 ? `TEST RESULTS: ${passedChecks} / ${totalChecks} PASSED`
                 : "TEST RESULTS"}
             </div>
             <button
               type="button"
               className={styles["validation-toggle"]}
               onClick={() => setIsValidationCollapsed((prev) => !prev)}
               aria-label={isValidationCollapsed ? "Show test results" : "Hide test results"}
               title={isValidationCollapsed ? "Show" : "Hide"}
             >
               {isValidationCollapsed ? ">>" : "<<"}
             </button>
           </div>

           <div className={styles["validation-body"]}>
             {validationResult && (
               <>
                 <div className={styles["validation-subtitle"]}>Objectives</div>
                 {Object.values(validationResult).map((obj, index) => (
                   <div
                     key={index}
                     className={obj.passed ? styles["test-pass"] : styles["test-fail"]}
                   >
                     <span className={styles["test-icon"]}>{obj.passed ? "✔" : "✖"}</span>
                     <span>{obj.label}</span>
                   </div>
                 ))}
               </>
             )}

             {Array.isArray(testResults) && testResults.length > 0 && (
               <>
                 <div className={styles["validation-subtitle"]}>Runtime Tests</div>
                 {testResults.map((test, index) => (
                   <div
                     key={`runtime-${index}`}
                     className={test.passed ? styles["test-pass"] : styles["test-fail"]}
                   >
                     <span className={styles["test-icon"]}>{test.passed ? "✔" : "✖"}</span>
                     <span>
                       Test {index + 1} - Input: <code>{test.input}</code> | Expected:{" "}
                       <code>{test.expected}</code> | Output: <code>{test.output}</code>
                     </span>
                   </div>
                 ))}
               </>
             )}

             {totalChecks > 0 && passedChecks === totalChecks && (
               <div className={styles["all-pass"]}>🎉 All tests passed!</div>
             )}

             {validationResult && unlockedHintCount > 0 && (
               <div className={styles["hint-box"]}>
                 <div className={styles["hint-title"]}>Hints unlocked</div>
                 {progressiveHints.slice(0, unlockedHintCount).map((hint, index) => (
                   <div key={index} className={styles["hint-item"]}>
                     <strong>{hint.level}:</strong> {hint.text}
                   </div>
                 ))}
               </div>
             )}
           </div>
         </div>
       )}

      {(!isQuestActive || isQuestCompleted) && (
        <div className={styles["terminal-lock-overlay"]}>
          <p className={styles["terminal-lock-text"]}>Interact with something to unlock this code terminal.</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveTerminal;
