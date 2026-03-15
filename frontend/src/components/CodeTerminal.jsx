import React, { useRef, useState, useMemo, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Check } from "lucide-react";
import styles from "../styles/PythonExercise.module.css";
import useValidateExercise from "../services/validateExercise";
import useValidateExercisePreview from "../services/validateExercisePreview";
import useCreateDomSession from "../services/useCreateDomSession";
import useUpdateDomSession from "../services/useUpdateDomSession";
import useDeleteDomSession from "../services/useDeleteDomSession";
import useValidateDom from "../services/useValidateDom";
import useAuth from "../hooks/useAxios";

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

function recordGuestQuestCompletion(quest, questId) {
  const languageId = Number(quest?.programming_language_id);
  const qid = Number(quest?.dbId ?? questId ?? quest?.id);
  const orderIndex = Number(quest?.order_index);

  if (!Number.isFinite(languageId) || !Number.isFinite(qid)) return;
  if (Number.isFinite(orderIndex) && orderIndex > 2) return;

  const key = "guestProgress:v1";
  let payload = null;
  try {
    payload = JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    payload = null;
  }

  const completedByLang =
    payload?.completedByLang && typeof payload.completedByLang === "object"
      ? payload.completedByLang
      : {};

  const langKey = String(languageId);
  const existing = Array.isArray(completedByLang[langKey]) ? completedByLang[langKey] : [];
  const next = Array.from(new Set([...existing, qid])).sort((a, b) => a - b);
  completedByLang[langKey] = next;

  const nextPayload = {
    version: 1,
    completedByLang,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(nextPayload));
  } catch {
    // ignore
  }
}

function normalizeObjectiveList(objectives) {
  if (!objectives) return [];
  if (Array.isArray(objectives)) return objectives;
  if (typeof objectives === "object") return Object.values(objectives);
  return [];
}

function formatCaseValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatOrEmpty(value) {
  const formatted = formatCaseValue(value);
  return formatted && String(formatted).trim() ? formatted : "(empty)";
}

function getQuestExpectedOutput(quest) {
  const direct = quest?.expected_output ?? quest?.expectedOutput;
  if (typeof direct === "string" && direct.trim()) return direct;

  const reqObjectives = Array.isArray(quest?.requirements?.objectives)
    ? quest.requirements.objectives
    : [];

  const outputObj = reqObjectives.find((o) => String(o?.type || "").toLowerCase() === "output_equals");
  const fromObjective = outputObj?.value;
  if (typeof fromObjective === "string" && fromObjective.trim()) return fromObjective;

  return "";
}

function getQuestRequirementsBlueprint(quest) {
  const req = quest?.requirements;

  // Admin/editor sometimes stores objectives as an array of { label }
  if (Array.isArray(req)) {
    return req
      .map((r) => (typeof r?.label === "string" ? r.label : ""))
      .filter((s) => s.trim())
      .map((label) => ({ label, passed: null }));
  }

  // Multi-objective quests store { objectives: [...] }
  const objectives = Array.isArray(req?.objectives) ? req.objectives : [];
  if (objectives.length) {
    return objectives
      .filter((o) => String(o?.type || "").toLowerCase() !== "output_equals")
      .map((o) => ({
        label: o?.label || "Objective",
        passed: null,
      }));
  }

  // Game-data JSON uses { mustInclude: [...] }
  const mustInclude = Array.isArray(req?.mustInclude) ? req.mustInclude : [];
  if (mustInclude.length) {
    return mustInclude
      .map((t) => String(t || "").trim())
      .filter(Boolean)
      .map((token) => ({ label: `Must include: ${token}`, passed: null }));
  }

  return [];
}

function getQuestRuntimeTestBlueprint(quest) {
  const cases = Array.isArray(quest?.requirements?.test_cases)
    ? quest.requirements.test_cases
    : [];

  return cases
    .map((t) => ({
      input: t?.input ?? "",
      expected: t?.expected ?? "",
      output: "-",
      passed: null,
    }))
    .filter((t) => String(t.input).trim() || String(t.expected).trim());
}

const InteractiveTerminal = ({
  quest,
  questId,
  practiceMode = false,
  mobileActivePanel,
  onMobilePanelChange,
  showMobilePanelSwitcher = true,
  enableMobileSplit = true
}) => {
  const { isAuthenticated } = useAuth();

  // `questId` prop is the engine quest id used by map triggers/events (typically 1-16).
  // Backend endpoints require the DB quest id (usually `quest.id`).
  const engineQuestId = Number(questId);
  const backendQuestId = Number(quest?.dbId ?? quest?.id ?? questId);
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
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [lastValidatedOutput, setLastValidatedOutput] = useState(null);
  const [lastValidatedCode, setLastValidatedCode] = useState(null);
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
  const [activeRuntimeTestIndex, setActiveRuntimeTestIndex] = useState(0);
  const [activeObjectiveIndex, setActiveObjectiveIndex] = useState(0);
  const [activeSidebarTab, setActiveSidebarTab] = useState("objectives");
  const [bottomPanelTab, setBottomPanelTab] = useState("terminal");
  const [resultView, setResultView] = useState("runtime");
  const [activeResultCaseIndex, setActiveResultCaseIndex] = useState(0);

  const validateExercise = useValidateExercise();
  const validateExercisePreview = useValidateExercisePreview();
  const validateDom = useValidateDom();

  const createDomSession = useCreateDomSession();
  const updateDomSession = useUpdateDomSession();
  const deleteDomSession = useDeleteDomSession();
  const socketRef = useRef(null);
  const terminalRef = useRef(null);
  const iframeRef = useRef(null);
  const useMobileSplit = isMobileView && enableMobileSplit;

  const canInteract = practiceMode || (isQuestActive && !isQuestCompleted);
  

  const activePanel = mobileActivePanel ?? internalActivePanel;
  const isBusy = isRunning || isSubmitting || isValidating;
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
        questId: backendQuestId,
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
      if (practiceMode) {
        setIsQuestActive(true);
        return;
      }
      const startedId = Number(e.detail?.questId);
      if (Number.isFinite(engineQuestId) && startedId === engineQuestId && !isQuestCompleted) {
        setIsQuestActive(true);
      }
    };

    const handleQuestComplete = (e) => {
      const completedId = Number(e.detail?.questId);
      if (Number.isFinite(engineQuestId) && completedId === engineQuestId) {
        if (practiceMode) {
          setIsRunning(false);
          setIsSubmitting(false);
          setWaitingForInput(false);
          terminalRef.current?.blur();
          setIsQuestActive(true);
          return;
        }
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
  }, [engineQuestId, isQuestCompleted, practiceMode]);

  useEffect(() => {
    if (!practiceMode) return;
    setIsQuestActive(true);
    setIsQuestCompleted(false);
  }, [practiceMode, engineQuestId]);

  useEffect(() => {
    setIsQuestActive(false);
    setIsQuestCompleted(false);
    setTestResults(null);
    setIsSubmitting(false);
    setIsRunning(false);
    setWaitingForInput(false);
    setValidationResult(null);
    setFailedSubmissions(0);
    setLastValidatedOutput(null);
    setLastValidatedCode(null);
    setCode(resolveInitialCode());
    setActivePanel("editor");
    setIsValidationCollapsed(false);
  }, [engineQuestId, backendQuestId, quest?.starting_code]);

  const handleRunValidation = async () => {
    if (!quest || !canInteract || isValidating || isSubmitting) return;

    // DOM quests: validate against DOM requirements (no completion here)
    if (quest?.quest_type === "dom") {
      if (!domSessionId) return;

      setIsValidating(true);
      try {
        const result = await validateDom(domSessionId, quest.requirements);
        if (result?.success) {
          setValidationResult(result?.data?.objectives || null);
          setTestResults([]);
          setLastValidatedOutput("__dom__");
          setLastValidatedCode(code);

          if (result?.data?.passed) {
            setFailedSubmissions(0);
          } else {
            setFailedSubmissions((prev) => prev + 1);
          }
        }
      } catch (err) {
        console.error("DOM validation failed:", err);
      } finally {
        setIsValidating(false);
      }

      return;
    }

    setIsValidating(true);
    try {
      const outputForValidation = await executeCodeForValidation();

      // Check for execution errors before validating
      if (hasExecutionError(outputForValidation, language)) {
        setLastValidatedOutput(null);
        setLastValidatedCode(null);
        return;
      }

      const result = await validateExercisePreview(backendQuestId, outputForValidation, code);

      if (result?.objectives) {
        setValidationResult(result.objectives);
      }

      setTestResults(normalizeTestResults(result));
      setLastValidatedOutput(outputForValidation);
      setLastValidatedCode(code);

      if (result?.success) {
        setFailedSubmissions(0);
      } else {
        setFailedSubmissions((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  };

  const hasAnyResults =
    Boolean(validationResult) || (Array.isArray(testResults) && testResults.length > 0);

  const resultObjectives = useMemo(
    () => (validationResult ? normalizeObjectiveList(validationResult) : []),
    [validationResult]
  );
  const resultRuntimeTests = useMemo(
    () => (Array.isArray(testResults) ? testResults : []),
    [testResults]
  );
  const hasResultObjectives = resultObjectives.length > 0;
  const hasResultRuntimeTests = resultRuntimeTests.length > 0;

  useEffect(() => {
    if (hasAnyResults) setIsValidationCollapsed(false);
  }, [hasAnyResults]);

  useEffect(() => {
    // Desktop: after running, jump to the "Test Result" tab.
    if (useMobileSplit) return;
    if (!hasAnyResults) return;
    setBottomPanelTab("result");
  }, [hasAnyResults, useMobileSplit]);

  useEffect(() => {
    if (hasResultRuntimeTests) {
      setResultView("runtime");
      return;
    }
    if (hasResultObjectives) {
      setResultView("objectives");
    }
  }, [hasResultObjectives, hasResultRuntimeTests]);

  useEffect(() => {
    const activeList = resultView === "runtime" ? resultRuntimeTests : resultObjectives;
    setActiveResultCaseIndex((prev) => {
      const max = Math.max(0, activeList.length - 1);
      return Math.min(prev, max);
    });
  }, [resultView, resultObjectives.length, resultRuntimeTests.length]);

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
      let resolved = false;

      const done = (value) => {
        if (resolved) return;
        resolved = true;
        resolve(value);
      };

      const timer = setTimeout(() => {
        try {
          socket.close();
        } catch {
          null;
        }
        done(finalOutput);
      }, 6000);

      socket.onopen = () => {
        socket.send(JSON.stringify({ language, code }));
      };

      socket.onmessage = (e) => {
        finalOutput += e.data;
      };

      socket.onclose = () => {
        clearTimeout(timer);
        done(finalOutput);
      };

      socket.onerror = () => {
        try {
          socket.close();
        } catch {
          null;
        }
        clearTimeout(timer);
        done(finalOutput);
      };
    });

  /* ===============================
     RUN BUTTON
  =============================== */

  const handleSubmit = async () => {
    if (!quest || !canInteract || isRunning || isSubmitting || isValidating) return;

    // Submit is only allowed after a successful validation run
    if (!lastValidatedCode || lastValidatedCode !== code) return;
    if (!lastValidatedOutput) return;

    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const result = await validateExercise(
        backendQuestId,
        lastValidatedOutput,
        code
      );
      if (result?.objectives) {
        setValidationResult(result.objectives);
      }

      setTestResults(normalizeTestResults(result));

      if (result?.success) {
        setFailedSubmissions(0);

        if (!isAuthenticated) {
          recordGuestQuestCompletion(quest, backendQuestId);
        }

        const engineQuestId = Number(
          quest?.order_index ?? quest?.orderIndex ?? questId
        );
        window.dispatchEvent(
          new CustomEvent("code-mania:quest-complete", {
            detail: { questId: Number.isFinite(engineQuestId) ? engineQuestId : questId }
          })
        );
      } else {
        // keep hints progression on validation runs
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRun = () => {
    if (isSubmitting || isValidating) return;

    setProgramOutput("");
    setInputBuffer("");
    setWaitingForInput(false);
    if (quest?.quest_type === "dom") {
      Promise.resolve(runDOM()).then(() => handleRunValidation());
    } else {
      setIsRunning(true);
      runViaDocker();
      handleRunValidation();
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
    if (!domSessionId || isSubmitting || isRunning || isValidating) return;

    // Submit is only allowed after a successful validation run
    if (!lastValidatedCode || lastValidatedCode !== code) return;

    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      window.dispatchEvent(
        new CustomEvent("code-mania:quest-complete", {
          detail: { questId: Number.isFinite(engineQuestId) ? engineQuestId : questId }
        })
      );
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
    if (!canInteract || !isRunning) {
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

  const runtimeTests = Array.isArray(testResults) ? testResults : [];
  const runtimeBlueprint = useMemo(() => getQuestRuntimeTestBlueprint(quest), [quest]);
  const displayedRuntimeTests = runtimeTests.length ? runtimeTests : runtimeBlueprint;

  useEffect(() => {
    setActiveRuntimeTestIndex((prev) => {
      const max = Math.max(0, displayedRuntimeTests.length - 1);
      return Math.min(prev, max);
    });
  }, [displayedRuntimeTests.length]);

  const initialObjectives = useMemo(() => getQuestRequirementsBlueprint(quest), [quest]);
  const objectiveItems = validationResult
    ? normalizeObjectiveList(validationResult)
    : initialObjectives;

  const hasObjectives = objectiveItems.length > 0;
  const hasRuntimeTests = displayedRuntimeTests.length > 0;

  useEffect(() => {
    if (hasRuntimeTests) return;
    setActiveSidebarTab("objectives");
  }, [hasRuntimeTests]);

  useEffect(() => {
    setActiveObjectiveIndex((prev) => {
      const max = Math.max(0, objectiveItems.length - 1);
      return Math.min(prev, max);
    });
  }, [objectiveItems.length]);

  const totalObjectives = objectiveItems.length;
  const passedObjectives = objectiveItems.filter((obj) => obj?.passed).length;

  const totalRuntimeTests = displayedRuntimeTests.length;
  const passedRuntimeTests = runtimeTests.length
    ? runtimeTests.filter((t) => t?.passed).length
    : 0;

  const totalChecks = totalObjectives + totalRuntimeTests;
  const passedChecks = passedObjectives + passedRuntimeTests;

  const allChecksPassed = totalChecks > 0 && passedChecks === totalChecks;
  const canSubmit =
    allChecksPassed &&
    Boolean(lastValidatedCode) &&
    lastValidatedCode === code &&
    Boolean(lastValidatedOutput);

  const renderTestSidebar = ({ fullWidth = false } = {}) => {
    return (
      <aside
        className={`${styles["test-sidebar"]} ${fullWidth ? styles["test-sidebar-full"] : ""}`}
        aria-label="Test cases"
      >
        <div className={styles["test-sidebar-header"]}>
          <div className={styles["test-sidebar-title"]}>Test Cases</div>
          <div
            className={`${styles["test-sidebar-pill"]} ${
              totalChecks > 0 && passedChecks === totalChecks
                ? styles["test-sidebar-pill-pass"]
                : totalChecks > 0
                  ? styles["test-sidebar-pill-warn"]
                  : styles["test-sidebar-pill-idle"]
            }`}
            title={totalChecks > 0 ? `${passedChecks}/${totalChecks} passed` : "Run to validate"}
          >
            {totalChecks > 0 ? `${passedChecks}/${totalChecks}` : "Run"}
          </div>
        </div>

          <div className={styles["test-sidebar-body"]}>
            {!hasRuntimeTests && !hasObjectives ? (
              <div className={styles["test-sidebar-empty"]}>
                Run your code to validate the test cases.
              </div>
            ) : null}

            {hasObjectives || hasRuntimeTests ? (
              <div className={styles["test-sidebar-tabs"]} role="tablist" aria-label="Test sidebar">
                {hasObjectives ? (
                  <button
                    type="button"
                    className={`${styles["test-sidebar-tab"]} ${activeSidebarTab === "objectives" ? styles["test-sidebar-tab-active"] : ""}`}
                    onClick={() => setActiveSidebarTab("objectives")}
                    role="tab"
                    aria-selected={activeSidebarTab === "objectives"}
                  >
                    Objectives
                  </button>
                ) : null}

                {hasRuntimeTests ? (
                  <button
                    type="button"
                    className={`${styles["test-sidebar-tab"]} ${activeSidebarTab === "runtime" ? styles["test-sidebar-tab-active"] : ""}`}
                    onClick={() => setActiveSidebarTab("runtime")}
                    role="tab"
                    aria-selected={activeSidebarTab === "runtime"}
                  >
                    Runtime Tests
                  </button>
                ) : null}
              </div>
            ) : null}

            {hasObjectives && activeSidebarTab === "objectives" ? (
              <div className={styles["test-sidebar-section"]}>
                <div className={styles["test-sidebar-section-title"]}>Objectives</div>

                <div className={styles["runtime-tabs"]} role="tablist" aria-label="Objective cases">
                  {objectiveItems.map((obj, idx) => {
                    const passed = obj?.passed === null || obj?.passed === undefined
                      ? null
                      : Boolean(obj?.passed);
                    const isActive = idx === activeObjectiveIndex;
                    const mark = passed === null ? "--" : passed ? "✔" : "✖";

                    return (
                      <button
                        key={`obj-tab-${idx}`}
                        type="button"
                        className={`${styles["runtime-tab"]} ${isActive ? styles["runtime-tab-active"] : ""}`}
                        onClick={() => setActiveObjectiveIndex(idx)}
                        role="tab"
                        aria-selected={isActive}
                        title={passed === null ? "Pending" : passed ? "Pass" : "Fail"}
                      >
                        <span className={styles["runtime-tab-mark"]}>{mark}</span>
                        <span className={styles["runtime-tab-label"]}>Case {idx + 1}</span>
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const obj = objectiveItems[activeObjectiveIndex] || {};
                  const passed = obj?.passed === null || obj?.passed === undefined
                    ? null
                    : Boolean(obj?.passed);

                  return (
                    <div
                      className={`${styles["runtime-panel"]} ${
                        passed === null
                          ? styles["testcase-card-pending"]
                          : passed
                            ? styles["testcase-card-pass"]
                            : styles["testcase-card-fail"]
                      }`}
                      role="tabpanel"
                    >
                      <div className={styles["runtime-panel-head"]}>
                        <div className={styles["testcase-card-title"]}>Case {activeObjectiveIndex + 1}</div>
                        <div className={styles["testcase-status"]}>
                          {passed === null ? "PENDING" : passed ? "PASS" : "FAIL"}
                        </div>
                      </div>

                      <div className={styles["runtime-panel-body"]}>
                        <div className={styles["testcase-cell"]}>
                          <div className={styles["testcase-label"]}>Requirement</div>
                          <pre className={styles["testcase-value"]}>{formatOrEmpty(obj?.label)}</pre>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : null}

            {hasRuntimeTests && activeSidebarTab === "runtime" ? (
              <div className={styles["test-sidebar-section"]}>
                <div className={styles["test-sidebar-section-title"]}>Runtime Tests</div>

              <div className={styles["runtime-tabs"]} role="tablist" aria-label="Runtime test cases">
                {displayedRuntimeTests.map((t, idx) => {
                  const passed = t?.passed === null || t?.passed === undefined
                    ? null
                    : Boolean(t?.passed);
                  const isActive = idx === activeRuntimeTestIndex;
                  const mark = passed === null ? "--" : passed ? "✔" : "✖";

                  return (
                    <button
                      key={`rt-tab-${idx}`}
                      type="button"
                      className={`${styles["runtime-tab"]} ${isActive ? styles["runtime-tab-active"] : ""}`}
                      onClick={() => setActiveRuntimeTestIndex(idx)}
                      role="tab"
                      aria-selected={isActive}
                      title={passed === null ? "Pending" : passed ? "Pass" : "Fail"}
                    >
                      <span className={styles["runtime-tab-mark"]}>{mark}</span>
                      <span className={styles["runtime-tab-label"]}>Case {idx + 1}</span>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const t = displayedRuntimeTests[activeRuntimeTestIndex] || {};
                const passed = t?.passed === null || t?.passed === undefined
                  ? null
                  : Boolean(t?.passed);

                return (
                  <div
                    className={`${styles["runtime-panel"]} ${
                      passed === null
                        ? styles["testcase-card-pending"]
                        : passed
                          ? styles["testcase-card-pass"]
                          : styles["testcase-card-fail"]
                    }`}
                    role="tabpanel"
                  >
                    <div className={styles["runtime-panel-head"]}>
                      <div className={styles["testcase-card-title"]}>Case {activeRuntimeTestIndex + 1}</div>
                      <div className={styles["testcase-status"]}>
                        {passed === null ? "PENDING" : passed ? "PASS" : "FAIL"}
                      </div>
                    </div>

                    <div className={styles["runtime-panel-body"]}>
                      <div className={styles["testcase-cell"]}>
                        <div className={styles["testcase-label"]}>Input</div>
                        <pre className={styles["testcase-value"]}>{formatOrEmpty(t?.input)}</pre>
                      </div>

                      <div className={styles["testcase-cell"]}>
                        <div className={styles["testcase-label"]}>Output</div>
                        <pre className={styles["testcase-value"]}>{formatOrEmpty(t?.output)}</pre>
                      </div>

                      <div className={styles["testcase-cell"]}>
                        <div className={styles["testcase-label"]}>Expected</div>
                        <pre className={styles["testcase-value"]}>{formatOrEmpty(t?.expected)}</pre>
                      </div>
                    </div>
                  </div>
                );
              })()}
             </div>
           ) : null}
        </div>

        <div className={styles["test-sidebar-footer"]}>
          <div className={styles["test-sidebar-footer-left"]}>
            {canSubmit ? "Submit unlocked" : "Submit locked"}
          </div>
          <div className={styles["test-sidebar-footer-right"]}>
            {canSubmit ? "All checks passed" : "Pass all tests"}
          </div>
        </div>
      </aside>
    );
  };

  const renderTestResultPanel = () => {
    const totalResultChecks = resultObjectives.length + resultRuntimeTests.length;
    const passedResultChecks =
      resultObjectives.filter((o) => o?.passed).length +
      resultRuntimeTests.filter((t) => t?.passed).length;

    const allPassed = totalResultChecks > 0 && passedResultChecks === totalResultChecks;
    const statusText = !totalResultChecks
      ? "No Results"
      : allPassed
        ? "Accepted"
        : "Wrong Answer";

    const activeList = resultView === "runtime" ? resultRuntimeTests : resultObjectives;
    const activeCase = activeList[activeResultCaseIndex] || {};
    const runtimeMs =
      typeof activeCase?.execution_time_ms === "number"
        ? activeCase.execution_time_ms
        : typeof activeCase?.runtime_ms === "number"
          ? activeCase.runtime_ms
          : null;

    return (
      <div className={styles["result-wrap"]} aria-label="Test result">
        <div className={styles["result-header"]}>
          <div
            className={`${styles["result-status"]} ${
              allPassed ? styles["result-status-accepted"] : styles["result-status-wrong"]
            }`}
          >
            {statusText}
          </div>
          <div className={styles["result-meta"]}>
            {runtimeMs !== null
              ? `Runtime: ${runtimeMs} ms`
              : `${passedResultChecks}/${totalResultChecks} passed`}
          </div>
        </div>

        {(hasResultRuntimeTests || hasResultObjectives) ? (
          <div className={styles["result-top-tabs"]} role="tablist" aria-label="Result category">
            {hasResultRuntimeTests ? (
              <button
                type="button"
                className={`${styles["result-top-tab"]} ${resultView === "runtime" ? styles["result-top-tab-active"] : ""}`}
                onClick={() => setResultView("runtime")}
                role="tab"
                aria-selected={resultView === "runtime"}
              >
                Testcase
              </button>
            ) : null}
            {hasResultObjectives ? (
              <button
                type="button"
                className={`${styles["result-top-tab"]} ${resultView === "objectives" ? styles["result-top-tab-active"] : ""}`}
                onClick={() => setResultView("objectives")}
                role="tab"
                aria-selected={resultView === "objectives"}
              >
                Objectives
              </button>
            ) : null}
          </div>
        ) : null}

        {!hasAnyResults ? (
          <div className={styles["result-empty"]}>Run your code to see test results.</div>
        ) : null}

        {activeList.length ? (
          <>
            <div className={styles["runtime-tabs"]} role="tablist" aria-label="Result cases">
              {activeList.map((item, idx) => {
                const passed = item?.passed === null || item?.passed === undefined
                  ? null
                  : Boolean(item?.passed);
                const isActive = idx === activeResultCaseIndex;
                const mark = passed === null ? "--" : passed ? "✔" : "✖";

                return (
                  <button
                    key={`res-case-${idx}`}
                    type="button"
                    className={`${styles["runtime-tab"]} ${isActive ? styles["runtime-tab-active"] : ""}`}
                    onClick={() => setActiveResultCaseIndex(idx)}
                    role="tab"
                    aria-selected={isActive}
                    title={passed === null ? "Pending" : passed ? "Pass" : "Fail"}
                  >
                    <span className={styles["runtime-tab-mark"]}>{mark}</span>
                    <span className={styles["runtime-tab-label"]}>Case {idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {resultView === "runtime" ? (
              <div className={styles["result-panel"]} role="tabpanel">
                <div className={styles["result-section-title"]}>Input</div>
                <div className={styles["result-block"]}>
                  <pre className={styles["result-block-pre"]}>{formatOrEmpty(activeCase?.input)}</pre>
                </div>

                <div className={styles["result-section-title"]}>Output</div>
                <div className={styles["result-block"]}>
                  <pre className={styles["result-block-pre"]}>{formatOrEmpty(activeCase?.output)}</pre>
                </div>

                <div className={styles["result-section-title"]}>Expected</div>
                <div className={styles["result-block"]}>
                  <pre className={styles["result-block-pre"]}>{formatOrEmpty(activeCase?.expected)}</pre>
                </div>
              </div>
            ) : (
              <div className={styles["result-panel"]} role="tabpanel">
                <div className={styles["result-section-title"]}>Requirement</div>
                <div className={styles["result-block"]}>
                  <pre className={styles["result-block-pre"]}>{formatOrEmpty(activeCase?.label)}</pre>
                </div>
              </div>
            )}

            {validationResult && unlockedHintCount > 0 ? (
              <div className={styles["hint-box"]} style={{ marginTop: 14 }}>
                <div className={styles["hint-title"]}>Hints unlocked</div>
                {progressiveHints.slice(0, unlockedHintCount).map((hint, index) => (
                  <div key={index} className={styles["hint-item"]}>
                    <strong>{hint.level}:</strong> {hint.text}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    );
  };

  /* ===============================
     RENDER
  =============================== */

  return (
    <div className={`${styles["code-container"]} ${!canInteract ? styles["code-container-locked"] : ""}`}>
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
                        !canInteract ? styles["btn-disabled"] : ""
                      }`}
                onClick={handleRun}
                disabled={isRunning || isSubmitting || isValidating || !canInteract}
                title="Test your code and see the output"
              >
              <Play size={16} />
              {isValidating ? "Validating..." : isRunning ? "Running..." : "Run"}
            </button>
            <button
              className={`${styles["submit-btn"]} ${
                        !canInteract ? styles["btn-disabled"] : ""
                      }`}
              onClick={quest?.quest_type === "dom" ? handleSubmitDom : handleSubmit}
              disabled={
                isRunning ||
                isSubmitting ||
                isValidating ||
                !canInteract ||
                !canSubmit
              }
              title={canSubmit ? "Submit your solution to complete the quest" : "Run and pass all test cases to unlock Submit"}
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
            if (!canInteract) return;
            const next = v ?? "";
            setCode(next);
            if (lastValidatedCode && next !== lastValidatedCode) {
              setLastValidatedCode(null);
              setLastValidatedOutput(null);
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            readOnly: !canInteract
          }}
        />
      </div>
      )}

      {(!useMobileSplit || activePanel === "terminal") && (() => {
        const terminalView = (
          <div className={styles["terminal-main"]}>
            {quest?.quest_type === "dom" ? (
              <iframe
                ref={iframeRef}
                sandbox="allow-scripts"
                src={sandboxUrl}
                className={styles["dom-preview"]}
              />
            ) : (
              <div
                className={`${styles["terminal"]} ${!isRunning ? styles["terminal-disabled"] : ""}`}
                ref={terminalRef}
                tabIndex={isRunning && canInteract ? 0 : -1}
                onClick={() =>
                  isRunning &&
                  canInteract &&
                  terminalRef.current?.focus()
                }
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
            )}
          </div>
        );

        return (
          <div className={styles["bottom-panel"]}>
            <div className={styles["bottom-panel-tabs"]} role="tablist" aria-label="Bottom panel">
              <button
                type="button"
                className={`${styles["bottom-panel-tab"]} ${bottomPanelTab === "terminal" ? styles["bottom-panel-tab-active"] : ""}`}
                onClick={() => setBottomPanelTab("terminal")}
                role="tab"
                aria-selected={bottomPanelTab === "terminal"}
              >
                Terminal
              </button>
              <button
                type="button"
                className={`${styles["bottom-panel-tab"]} ${bottomPanelTab === "tests" ? styles["bottom-panel-tab-active"] : ""}`}
                onClick={() => setBottomPanelTab("tests")}
                role="tab"
                aria-selected={bottomPanelTab === "tests"}
              >
                Test Cases
              </button>
              <button
                type="button"
                className={`${styles["bottom-panel-tab"]} ${bottomPanelTab === "result" ? styles["bottom-panel-tab-active"] : ""}`}
                onClick={() => setBottomPanelTab("result")}
                role="tab"
                aria-selected={bottomPanelTab === "result"}
                disabled={!hasAnyResults}
                title={!hasAnyResults ? "Run to see results" : ""}
              >
                Test Result
              </button>
            </div>

            <div className={styles["bottom-panel-body"]} role="tabpanel">
              {bottomPanelTab === "terminal" ? (
                terminalView
              ) : bottomPanelTab === "tests" ? (
                renderTestSidebar({ fullWidth: true })
              ) : (
                renderTestResultPanel()
              )}
            </div>
          </div>
        );
      })()}

      {!canInteract && (
        <div className={styles["terminal-lock-overlay"]}>
          <p className={styles["terminal-lock-text"]}>Interact with something to unlock this code terminal.</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveTerminal;
