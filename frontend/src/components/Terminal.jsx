import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import styles from "../styles/Terminal.module.css";

const Terminal = forwardRef((props, ref) => {
  const [lines, setLines] = useState([]);
  const wsRef = useRef(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    wsRef.current = ws;

    ws.onmessage = (e) => appendLine(e.data);

    return () => ws.close();
  }, []);

  const appendLine = (text) => {
    const newLines = text
      .split("\n")
      .map(line => line.replace(/^>>> ?/, "").trim())
      .filter(line => line !== "");

    if (newLines.length === 0) return;

    setLines(prev => [...prev, ...newLines]);
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  };

  // expose runCode() to parent
  useImperativeHandle(ref, () => ({
    runCode(code) {
      // clear previous output
      setLines([]);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        code.split("\n").forEach(line => wsRef.current.send(line));
      } else {
        appendLine("⚠️ Terminal not connected");
      }
      if (inputRef.current) inputRef.current.focus();
    }
  }));

  const handleInput = (e) => {
    if (e.key === "Enter") {
      const val = e.target.value;
      e.target.value = "";
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(val);
      } else {
        appendLine("⚠️ Terminal not connected");
      }
    }
  };

  return (
    <div className={styles.terminal}>
      <div ref={outputRef} className={styles.output}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Type here and press Enter"
        onKeyDown={handleInput}
        className={styles.input}
      />
    </div>
  );
});

export default Terminal;
