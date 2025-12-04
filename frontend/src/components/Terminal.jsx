import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import styles from "../styles/Terminal.module.css";

const Terminal = forwardRef((props, ref) => {
  const [lines, setLines] = useState([]);
  const wsRef = useRef(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws"); // same port as API
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ Connected to terminal");

    ws.onmessage = (e) => {
      // remove prompts like >>> but keep blank lines
      const clean = e.data.replace(/>>>|node>|cling>/g, "");
      const newLines = clean.split("\n"); // preserves newlines
      setLines(prev => [...prev, ...newLines]);
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    };

    ws.onclose = () => console.log("⚠️ Terminal disconnected");
    ws.onerror = () => console.log("⚠️ WebSocket error");

    return () => ws.close();
  }, []);

  // Expose runCode to parent
  useImperativeHandle(ref, () => ({
    runCode(code, language = "python") {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // set language first
        wsRef.current.send(JSON.stringify({ type: "language", language }));
        // send code
        wsRef.current.send(JSON.stringify({ type: "code", code }));
        setLines([]); // clear previous output
      } else {
        console.log("⚠️ Terminal not connected");
      }
      inputRef.current?.focus();
    }
  }));

  // handle user input
  const handleInput = (e) => {
    if (e.key === "Enter") {
      const val = e.target.value;
      setLines(prev => [...prev, val]); // echo input in terminal
      e.target.value = "";
      wsRef.current?.send(JSON.stringify({ type: "input", value: val }));
    }
  };

  return (
    <div className={styles.terminal}>
      <div ref={outputRef} className={styles.output}>
        {lines.map((line, i) => <div key={i}>{line}</div>)}
      </div>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        onKeyDown={handleInput}
        placeholder="Type input here..."
      />
    </div>
  );
});

export default Terminal;
