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
  language = "python",
  quest,
  onQuestComplete,
}) {
  const terminalWsUrl = import.meta.env.VITE_TERMINAL_WS_URL || "https://terminal.codemania.fun";
  const monacoLang = useMemo(() => getMonacoLang(language), [language]);
  const fileName = useMemo(() => getFileName(language), [language]);
  const expected = useMemo(() => normalizeOutput(quest?.expectedOutput || quest?.expected_output || ""), [quest]);
  const mustInclude = useMemo(() => {
    const req = quest?.requirements;
    const tokens = Array.isArray(req?.mustInclude) ? req.mustInclude : [];
    return tokens.map((t) => String(t || "")).filter(Boolean);
  }, [quest]);

  const initialCode = useMemo(() => {
    const raw = quest?.startingCode || quest?.starting_code || "";
    if (typeof raw === "string" && raw.trim()) return raw;
    return "print()";
  }, [quest]);

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
    if (status === "running") return;

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
    <div className={styles.demoTerminal}>
      <div className={styles.demoTerminalHeader}>
        <div className={styles.demoTerminalTitle}>
          <span className={styles.demoFileName}>{fileName}</span>
          <span className={`${styles.demoBadge} ${badgeClass}`}>
            {status === "running" ? "Running" : status === "pass" ? "Passed" : status === "fail" ? "Try again" : "Demo"}
          </span>
        </div>

        <button type="button" className={styles.demoRunBtn} onClick={handleRun} disabled={status === "running"}>
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
          }}
        />
      </div>

      <div className={styles.demoOutputWrap}>
        <div className={styles.demoOutputHeader}>Terminal</div>
        <pre className={styles.demoOutputBody}>{output || "▶ Output will appear here"}</pre>
        {hint ? <div className={styles.demoHint}>{hint}</div> : null}
      </div>
    </div>
  );
}
