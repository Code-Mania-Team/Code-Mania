import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./JavaScriptExercise.module.css";

const JavaScriptExercise = () => {
  const [code, setCode] = useState(`// Write your JavaScript code below ❤️
console.log("Hello, World!");`);
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // === Dialogue ===
  const dialogues = [
    "Welcome to your first JavaScript lesson! (click to continue)",
    "Let's start by printing something to the console!"
  ];
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    handleNextDialogue();
  }, []);

  const handleNextDialogue = () => {
    if (isTyping) return;
    const nextText = dialogues[currentDialogue];
    if (!nextText) return;
    setIsTyping(true);
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(nextText.slice(0, i));
      i++;
      if (i > nextText.length) {
        clearInterval(interval);
        setIsTyping(false);
        setCurrentDialogue((prev) =>
          prev + 1 < dialogues.length ? prev + 1 : prev
        );
      }
    }, 40);
  };

  const handleRunCode = () => {
    setOutput("Running script.js...\n");
    setTimeout(() => {
      try {
        // Capture console.log output
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.join(" "));
          originalLog(...args);
        };

        // Execute the code
        eval(code);

        // Restore console.log
        console.log = originalLog;

        if (logs.length > 0) {
          setOutput(`${logs.join("\n")}\n>>> Program finished with exit code 0`);
        } else {
          setOutput(
            "No output detected. Did you include a console.log() statement?\n>>> Program finished with exit code 0"
          );
        }
      } catch (error) {
        setOutput(
          `Error: ${error.message}\n>>> Program failed with exit code 1`
        );
      }
    }, 1000);
  };

  return (
    <div className={styles["javascript-exercise-page"]}>
      <Header />

      <div className={styles["codex-fullscreen"]}>
        {/* === PROGRESS === */}
        <div className={styles["lesson-progress"]}>
          <h2 className={styles["lesson-stage"]}>⚙️ Setting up</h2>
          <div className={styles["progress-bar"]}>
            <div className={styles["progress-fill"]} style={{ width: "8.33%" }} />
          </div>
          <p className={styles["progress-text"]}>Lesson 1 of 12</p>
        </div>

        {/* === GRID LAYOUT === */}
        <div className={styles["codex-grid"]}>
          {/* === LEFT SIDE === */}
          <div className={styles["game-container"]}>
            <div className={styles["game-preview"]}>
              <div className={styles["game-scene"]}>
                <img
                  src="https://cdn.pixabay.com/photo/2017/06/20/18/45/background-2426328_960_720.png"
                  alt="Game background"
                  className={styles["game-bg"]}
                />
                <img
                  src="https://www.freepngimg.com/thumb/rpg/3-2-rpg-png-6.png"
                  alt="Character"
                  className={styles["game-character"]}
                />
              </div>

              <div className={styles["dialogue-box"]} onClick={handleNextDialogue}>
                <p className={styles["dialogue-text"]}>{displayedText}</p>
              </div>
            </div>
          </div>

          {/* === RIGHT SIDE === */}
          <div className={styles["code-container"]}>
            <div className={styles["code-editor"]}>
              <div className={styles["editor-header"]}>
                <span>script.js</span>
                <button className={styles["run-btn"]} onClick={handleRunCode}>
                  <Play size={16} /> Run
                </button>
              </div>

              <textarea
                className={styles["code-box"]}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
              ></textarea>
            </div>

            <div className={styles["terminal"]}>
              <div className={styles["terminal-header"]}>Console</div>
              <div className={styles["terminal-body"]}>
                <div className={styles["terminal-line"]}>
                  <span className={styles["prompt"]}>›</span> node script.js
                </div>
                {output && (
                  <div className={styles["terminal-output"]}>{output}</div>
                )}
                <div className={styles["terminal-line"]}>
                  <span className={styles["prompt"]}>›</span>
                  <span className={styles["cursor"]}></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === HELP === */}
        <h3 className={styles["help-title"]}>Help</h3>
        <div className={styles["help-section"]}>
          <div
            className={styles["help-header"]} 
            onClick={() => setShowHelp(!showHelp)}
          >
            <span>💡 Hint</span>
            <span className={styles["help-arrow"]}>{showHelp ? "▴" : "▾"}</span>
          </div>

          {showHelp && (
            <div className={styles["help-content"]}>
              <p>
                Remember: In JavaScript, <code>console.log("Hello, World!");</code>
              </p>
              <p>
                Use <code>console.log()</code> to print messages to the console.
              </p>
              <p>
                Try changing the text inside the quotes and press <b>Run</b> to see the result!
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default JavaScriptExercise;