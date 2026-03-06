import React, { useRef, useState, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { Play, Trash2, ChevronDown, LockKeyhole, Sparkles } from "lucide-react";
import styles from "../styles/TerminalPage.module.css";
import { useNavigate } from "react-router-dom";
import useLearningProgress from "../services/useLearningProgress";
import useAuth from "../hooks/useAxios";

const LANGUAGES = [
    { id: "python", label: "Python", ext: "script.py", icon: "🐍" },
    { id: "cpp", label: "C++", ext: "main.cpp", icon: "⚙️" },
    { id: "javascript", label: "JavaScript", ext: "script.js", icon: "🟨" },
];

function getMonacoLang(lang) {
    if (lang === "cpp") return "cpp";
    if (lang === "javascript") return "javascript";
    return "python";
}

function getStarterCode(lang) {
    switch (lang) {
        case "javascript":
            return `// JavaScript Online Compiler\n// Write your code here and hit Run!\n\nconsole.log("Hello, World!");`;
        case "cpp":
            return `// C++ Online Compiler\n// Write your code here and hit Run!\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`;
        default:
            return `# Python Online Compiler\n# Write your code here and hit Run!\n\nprint("Hello, World!")`;
    }
}

const TerminalPage = () => {
    const terminalWsUrl = import.meta.env.VITE_TERMINAL_WS_URL || "ws://localhost:8080";
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const isAdmin = user?.role === "admin";
    const { progress, loading } = useLearningProgress();
    const hasTerminalAccess =
        isAdmin ||
        (progress || []).some((row) => Number(row?.completed || 0) >= 16);
    const maxCompletedInSingleCourse = Math.max(
        0,
        ...(progress || []).map((row) => Number(row?.completed || 0))
    );
    const remainingToUnlock = Math.max(0, 16 - maxCompletedInSingleCourse);

    const [language, setLanguage] = useState("python");
    const [code, setCode] = useState(() => getStarterCode("python"));
    const [programOutput, setProgramOutput] = useState("");
    const [inputBuffer, setInputBuffer] = useState("");
    const [waitingForInput, setWaitingForInput] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState("output"); // output or input

    const socketRef = useRef(null);
    const terminalRef = useRef(null);
    const terminalContentRef = useRef(null);
    const dropdownRef = useRef(null);

    const currentLangInfo = useMemo(
        () => LANGUAGES.find((l) => l.id === language) || LANGUAGES[0],
        [language]
    );

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowLangDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Auto-scroll terminal output
    useEffect(() => {
        if (terminalContentRef.current) {
            terminalContentRef.current.scrollTop = terminalContentRef.current.scrollHeight;
        }
    }, [programOutput, inputBuffer]);

    const handleLanguageChange = (langId) => {
        setLanguage(langId);
        setCode(getStarterCode(langId));
        setProgramOutput("");
        setInputBuffer("");
        setShowLangDropdown(false);
        setIsRunning(false);
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    };

    const runViaDocker = () => {
        if (socketRef.current) {
            socketRef.current.close();
        }

        let finalOutput = "";
        setProgramOutput("");
        setInputBuffer("");
        setWaitingForInput(false);
        setIsRunning(true);
        setActiveTab("output");

        const socket = new WebSocket(terminalWsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({ language, code }));
            setTimeout(() => {
                terminalRef.current?.focus();
            }, 0);
        };

        socket.onmessage = (e) => {
            finalOutput += e.data;
            setProgramOutput((prev) => prev + e.data);

            if (!e.data.endsWith("\n")) {
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

    const handleRun = () => {
        runViaDocker();
    };

    const handleClear = () => {
        setProgramOutput("");
        setInputBuffer("");
        setWaitingForInput(false);
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setIsRunning(false);
    };

    if (authLoading || (!isAdmin && loading)) {
        return null;
    }

    if (!hasTerminalAccess) {
        return (
            <div className={styles.terminalPage}>
                <div className={styles.lockedShell}>
                    <div className={styles.lockedCard}>
                        <div className={styles.lockedBadge}>
                            <LockKeyhole size={20} />
                            Terminal Locked
                        </div>

                        <h2 className={styles.lockedTitle}>Unlock the Code Forge</h2>
                        <p className={styles.lockedText}>
                            Complete at least <strong>16 exercises in one course</strong> to unlock Terminal mode.
                        </p>

                        <div className={styles.lockedStats}>
                            <div className={styles.lockedStatCard}>
                                <span className={styles.lockedStatLabel}>Best progress</span>
                                <span className={styles.lockedStatValue}>{maxCompletedInSingleCourse}/16</span>
                            </div>
                            <div className={styles.lockedStatCard}>
                                <span className={styles.lockedStatLabel}>Remaining</span>
                                <span className={styles.lockedStatValue}>{remainingToUnlock}</span>
                            </div>
                        </div>

                        <div className={styles.lockedHintRow}>
                            <Sparkles size={16} />
                            Finish one full course path to activate free coding terminal access.
                        </div>

                        <div className={styles.lockedActions}>
                            <button
                                type="button"
                                className={styles.runBtn}
                                onClick={() => navigate("/learn")}
                            >
                                Go to Courses
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.terminalPage}>
            {/* Top toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    {/* Language selector */}
                    <div className={styles.langSelector} ref={dropdownRef}>
                        <button
                            className={styles.langButton}
                            onClick={() => setShowLangDropdown(!showLangDropdown)}
                            type="button"
                        >
                            <span className={styles.langIcon}>{currentLangInfo.icon}</span>
                            <span className={styles.langLabel}>{currentLangInfo.label}</span>
                            <ChevronDown
                                size={14}
                                className={`${styles.langChevron} ${showLangDropdown ? styles.langChevronOpen : ""}`}
                            />
                        </button>
                        {showLangDropdown && (
                            <div className={styles.langDropdown}>
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.id}
                                        className={`${styles.langOption} ${language === lang.id ? styles.langOptionActive : ""}`}
                                        onClick={() => handleLanguageChange(lang.id)}
                                        type="button"
                                    >
                                        <span className={styles.langOptionIcon}>{lang.icon}</span>
                                        <span>{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.fileName}>
                        <span className={styles.fileIcon}>📄</span>
                        {currentLangInfo.ext}
                    </div>
                </div>

                <div className={styles.toolbarRight}>
                    <button
                        className={styles.clearBtn}
                        onClick={handleClear}
                        type="button"
                        title="Clear output"
                    >
                        <Trash2 size={16} />
                        <span className={styles.btnText}>Clear</span>
                    </button>
                    <button
                        className={`${styles.runBtn} ${isRunning ? styles.runBtnRunning : ""}`}
                        onClick={handleRun}
                        disabled={isRunning}
                        type="button"
                    >
                        <Play size={16} />
                        <span>{isRunning ? "Running..." : "Run"}</span>
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div className={styles.editorTerminalWrapper}>
                {/* Code Editor panel */}
                <div className={styles.editorPanel}>
                    <div className={styles.editorTabBar}>
                        <div className={styles.editorTab}>
                            <span className={styles.tabDot} />
                            {currentLangInfo.ext}
                        </div>
                    </div>
                    <div className={styles.editorContainer}>
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
                                padding: { top: 12, bottom: 12 },
                                lineNumbersMinChars: 3,
                                renderLineHighlight: "all",
                                smoothScrolling: true,
                                cursorBlinking: "smooth",
                                cursorSmoothCaretAnimation: "on",
                                bracketPairColorization: { enabled: true },
                            }}
                        />
                    </div>
                </div>

                {/* Terminal output panel */}
                <div className={styles.terminalPanel}>
                    <div className={styles.terminalTabBar}>
                        <button
                            className={`${styles.terminalTab} ${activeTab === "output" ? styles.terminalTabActive : ""}`}
                            onClick={() => setActiveTab("output")}
                            type="button"
                        >
                            Output
                        </button>
                    </div>
                    <div
                        className={styles.terminalContainer}
                        ref={terminalRef}
                        tabIndex={isRunning ? 0 : -1}
                        onClick={() => isRunning && terminalRef.current?.focus()}
                        onKeyDown={handleKeyDown}
                    >
                        <div className={styles.terminalContent} ref={terminalContentRef}>
                            {programOutput === "" && !isRunning ? (
                                <div className={styles.terminalPlaceholder}>
                                    <span className={styles.placeholderIcon}>▶</span>
                                    <span>Click <strong>Run</strong> to execute your code</span>
                                </div>
                            ) : (
                                <pre className={styles.terminalPre}>
                                    {programOutput}
                                    {waitingForInput && (
                                        <>
                                            {inputBuffer}
                                            <span className={styles.cursor}>▋</span>
                                        </>
                                    )}
                                    {isRunning && !waitingForInput && (
                                        <span className={styles.runningIndicator}>
                                            <span className={styles.dot} />
                                            <span className={styles.dot} />
                                            <span className={styles.dot} />
                                        </span>
                                    )}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TerminalPage;
