import React, { useEffect, useState, useRef } from "react";
import CodeTerminal from "./CodeTerminal";

const TerminalContainer = () => {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [activeQuestId, setActiveQuestId] = useState(null);
  const [terminalUnlocked, setTerminalUnlocked] = useState(false);
  const [terminalActive, setTerminalActive] = useState(false);

  const textareaRef = useRef(null);

  /* -------------------------------
     LISTEN TO PHASER EVENTS
  -------------------------------- */
  useEffect(() => {
    const onQuestStarted = (e) => {
      setActiveQuestId(e.detail.id);
      setTerminalUnlocked(true);
      setOutput("Quest started. Walk to the terminal and press E.");
    };

    const onTerminalOpen = (e) => {
      if (e.detail.questId !== activeQuestId) return;
      setTerminalActive(true);
    };

    window.addEventListener("quest:started", onQuestStarted);
    window.addEventListener("terminal:open", onTerminalOpen);

    return () => {
      window.removeEventListener("quest:started", onQuestStarted);
      window.removeEventListener("terminal:open", onTerminalOpen);
    };
  }, [activeQuestId]);

  /* -------------------------------
     HARD BLOCK GAME KEYS
  -------------------------------- */
  useEffect(() => {
    if (!terminalActive) return;

    const stopKeys = (e) => {
      e.stopPropagation();
    };

    window.addEventListener("keydown", stopKeys, true);
    window.addEventListener("keyup", stopKeys, true);

    // Auto focus editor
    setTimeout(() => textareaRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", stopKeys, true);
      window.removeEventListener("keyup", stopKeys, true);
    };
  }, [terminalActive]);

  /* -------------------------------
     RUN CODE (SIMULATED)
  -------------------------------- */
  const runCode = async () => {
    if (!terminalActive || !activeQuestId) return;

    setIsRunning(true);
    setOutput("Running...\n");

    // Simulate judge
    await new Promise((r) => setTimeout(r, 1200));

    const success = code.trim().length > 0;

    if (success) {
      setOutput("✅ Correct output!\nQuest completed.");

      // Notify Phaser
      window.dispatchEvent(
        new CustomEvent("terminal:completed", {
          detail: { questId: activeQuestId }
        })
      );

      setTerminalActive(false);
      setTerminalUnlocked(false);
      setActiveQuestId(null);
      setCode("");
    } else {
      setOutput("❌ Incorrect output. Try again.");
    }

    setIsRunning(false);
  };

  /* -------------------------------
     RENDER
  -------------------------------- */
  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: "420px",
        height: "100vh",
        background: "#0f1117",
        borderLeft: "2px solid #1f2937",
        pointerEvents: terminalUnlocked ? "auto" : "none",
        opacity: terminalUnlocked ? 1 : 0.5,
        zIndex: 9999
      }}
    >
      <CodeTerminal
        code={code}
        onCodeChange={setCode}
        onRun={runCode}
        output={output}
        isRunning={isRunning}
        showRunButton={terminalActive}
        textareaRef={textareaRef}
      />
    </div>
  );
};

export default TerminalContainer;
