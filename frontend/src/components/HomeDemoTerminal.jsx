import React, { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, CheckCircle2 } from "lucide-react";
import styles from "../styles/HomeDemoQuest.module.css";

function normalizeOutput(raw = "") {
  return String(raw)
    .replace(/^▶ Running.*\n?/i, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function getMonacoLang(lang) {
  const v = String(lang || "").toLowerCase();
  if (v === "cpp") return "cpp";
  if (v === "javascript") return "javascript";
  return "python";
}

function getFileName(lang) {
  const v = String(lang || "").toLowerCase();
  if (v === "cpp") return "main.cpp";
  if (v === "javascript") return "script.js";
  return "script.py";
}

export default function HomeDemoTerminal({
  mode = "intro", // intro | quest
  armed = true,
  language = "python",
  quest,
  onIntroComplete,
  onQuestComplete,
  onGoLearn,
}) {
  const terminalWsUrl = import.meta.env.VITE_TERMINAL_WS_URL || "https://terminal.codemania.fun";
  const monacoLang = useMemo(() => (mode === "intro" ? "plaintext" : getMonacoLang(language)), [language, mode]);
  const fileName = useMemo(() => (mode === "intro" ? "welcome.txt" : getFileName(language)), [language, mode]);
  const expected = useMemo(() => normalizeOutput(quest?.expectedOutput || quest?.expected_output || ""), [quest]);
  const mustInclude = useMemo(() => {
    const req = quest?.requirements;
    const tokens = Array.isArray(req?.mustInclude) ? req.mustInclude : [];
    return tokens.map((t) => String(t || "")).filter(Boolean);
  }, [quest]);

  const initialCode = useMemo(() => {
    const raw = quest?.startingCode || quest?.starting_code || "";
    if (typeof raw === "string" && raw.trim()) return raw;
    return mode === "intro" ? "" : "print()";
  }, [quest, mode]);

  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | pass | fail
  const [hint, setHint] = useState("");
  const socketRef = useRef(null);
  const outputRef = useRef("");
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    return () => {
      try {
        socketRef.current?.close?.();
      } catch {
        // ignore
      }
      socketRef.current = null;
    };
  }, []);

  const resetTerminal = () => {
    outputRef.current = "";
    setOutput("");
  };

  const validate = ({ finalOutput }) => {
    if (mode === "intro") {
      const text = String(code || "").replace(/\r\n/g, "\n");
      const trimmed = text.trim();
      if (!trimmed) {
        setStatus("fail");
        setHint("Type a message first.");
        return;
      }

      setStatus("pass");
      setHint("Nice. You're ready for real exercises.");
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onIntroComplete?.();
      }
      return;
    }

    const normalized = normalizeOutput(finalOutput);

    if (mustInclude.length) {
      const ok = mustInclude.every((t) => code.includes(t));
      if (!ok) {
        setStatus("fail");
        setHint(`Try using: ${mustInclude.join(", ")}`);
        return;
      }
    }

    if (expected) {
      if (normalized !== expected) {
        setStatus("fail");
        setHint("Output must match exactly.");
        return;
      }
    }

    setStatus("pass");
    setHint("Quest complete!");
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onQuestComplete?.();
    }
  };

  const handleRun = () => {
    if (!armed) return;
    if (status === "running") return;

    if (mode === "intro") {
      setStatus("running");
      setHint("");
      resetTerminal();

      const text = String(code || "").replace(/\r\n/g, "\n");
      outputRef.current = text;
      setOutput(outputRef.current || "");

      // Mimic "run" without any server/tests.
      window.setTimeout(() => {
        setStatus((prev) => (prev === "running" ? "idle" : prev));
        validate({ finalOutput: text });
      }, 120);
      return;
    }

    setStatus("running");
    setHint("");
    resetTerminal();

    let finalOutput = "";
    try {
      socketRef.current?.close?.();
    } catch {
      // ignore
    }

    const socket = new WebSocket(terminalWsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ language, code }));
    };

    socket.onmessage = (e) => {
      const text = String(e.data || "");
      finalOutput += text;
      outputRef.current += text;
      setOutput(outputRef.current);
    };

    socket.onclose = () => {
      setStatus((prev) => (prev === "running" ? "idle" : prev));
      validate({ finalOutput });
    };

    socket.onerror = () => {
      outputRef.current += "\nConnection error. Please try again.\n";
      setOutput(outputRef.current);
      setStatus("fail");
      setHint("Terminal connection failed.");
      try {
        socket.close();
      } catch {
        // ignore
      }
    };
  };

  const badgeClass =
    status === "pass"
      ? styles.demoBadgePass
      : status === "fail"
        ? styles.demoBadgeFail
        : styles.demoBadgeIdle;

  return (
    <div className={`${styles.demoTerminal} ${!armed ? styles.demoTerminalLocked : ""}`}>
      <div className={styles.demoTerminalHeader}>
        <div className={styles.demoTerminalTitle}>
          <span className={styles.demoFileName}>{fileName}</span>
          <span className={`${styles.demoBadge} ${badgeClass}`}>
            {status === "running" ? "Running" : status === "pass" ? "Passed" : status === "fail" ? "Try again" : "Demo"}
          </span>
        </div>

        <button type="button" className={styles.demoRunBtn} onClick={handleRun} disabled={!armed || status === "running"}>
          {status === "pass" ? <CheckCircle2 size={16} /> : <Play size={16} />}
          {status === "running" ? "Running..." : "Run"}
        </button>
      </div>

      <div className={styles.demoEditorWrap}>
        <Editor
          height="240px"
          language={monacoLang}
          theme="vs-dark"
          value={code}
          onChange={(v) => {
            const next = v ?? "";
            setCode(next);
            if (status === "pass") {
              setStatus("idle");
              setHint("");
              hasCompletedRef.current = false;
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            readOnly: !armed,
          }}
        />
      </div>

      <div className={styles.demoOutputWrap}>
        <div className={styles.demoOutputHeader}>Terminal</div>
        <pre className={styles.demoOutputBody}>
          {output || (armed ? "▶ Output will appear here" : "Talk to the NPC in the demo world, then come back here.")}
        </pre>

        {hint ? <div className={styles.demoHint}>{hint}</div> : null}
        {mode === "intro" && status === "pass" ? (
          <div className={styles.demoNudgeRow}>
            <div className={styles.demoNudgeText}>There is more waiting in Learn.</div>
            <button type="button" className={styles.demoLearnBtn} onClick={() => onGoLearn?.()}>
              Go to Learn
            </button>
          </div>
        ) : null}
      </div>

      {!armed && (
        <div className={styles.terminalLockOverlay}>
          <p className={styles.terminalLockText}>Talk to the NPC in the demo world, then come back here.</p>
        </div>
      )}
    </div>
  );
}
