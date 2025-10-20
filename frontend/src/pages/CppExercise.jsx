import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./CppExercise.module.css";

const CppExercise = () => {
  const [code, setCode] = useState(`// Write your C++ code below ❤️
#include <iostream>
using namespace std;

int main() {
  cout << "Hello, World!" << endl;
  return 0;
}`);
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // === Dialogue ===
  const dialogues = [
    "Welcome to your first C++ lesson! (click to continue)",
    "Let's start by printing something to the terminal!"
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
    setOutput("Compiling and running main.cpp...\n");
    setTimeout(() => {
      if (code.includes("cout")) {
        const match = code.match(/"([^"]+)"/);
        const text = match ? match[1] : "Hello, C++!";
        setOutput(`${text}\n>>> Program finished with exit code 0`);
      } else {
        setOutput(
          "No output detected. Did you include a cout statement?\n>>> Program finished with exit code 0"
        );
      }
    }, 1000);
  };

  return (
    <div className={styles["cpp-exercise-page"]}>
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
                <span>main.cpp</span>
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
              <div className={styles["terminal-header"]}>Terminal</div>
              <div className={styles["terminal-body"]}>
                <div className={styles["terminal-line"]}>
                  <span className={styles["prompt"]}>$</span> g++ main.cpp -o main && ./main
                </div>
                {output && (
                  <div className={styles["terminal-output"]}>{output}</div>
                )}
                <div className={styles["terminal-line"]}>
                  <span className={styles["prompt"]}>$</span>
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
                Remember: In C++, <code>cout &lt;&lt; "Hello, World!";</code>
              </p>
              <p>
                Use <code>&lt;&lt;</code> to send text to <code>cout</code>.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CppExercise;
