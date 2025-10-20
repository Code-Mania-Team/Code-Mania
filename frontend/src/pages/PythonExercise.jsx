import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./PythonExercise.module.css"; // ✅ Scoped CSS Modules import

const PythonExercise = () => {
  const [code, setCode] = useState(`# Write code below ❤️
print("Hello, World!")`);
  const [output, setOutput] = useState("");

  // ✅ Add this line to fix the error
  const [showHelp, setShowHelp] = useState(false);

  // === Dialogue System ===
  const dialogues = [
    "Welcome to your first Python lesson! (click to continue)",
    "Let's start by printing something to the screen!"
  ];
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Automatically start dialogue on component mount
  useEffect(() => {
    handleNextDialogue();
  }, []);

  const handleNextDialogue = () => {
    if (isTyping) return;
    const nextText = dialogues[currentDialogue];
    if (!nextText) return;
    setIsTyping(true);
    setDisplayedText("");

    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(nextText.slice(0, index));
      index++;
      if (index > nextText.length) {
        clearInterval(interval);
        setIsTyping(false);
        setCurrentDialogue((prev) =>
          prev + 1 < dialogues.length ? prev + 1 : prev
        );
      }
    }, 40); // typing speed
  };

  const handleRunCode = () => {
    if (!code.includes("print(") && !code.includes("print ")) {
      setOutput("Error: No print statement found. Did you include 'print()'?");
      return;
    }

    try {
      const openParen = (code.match(/\(/g) || []).length;
      const closeParen = (code.match(/\)/g) || []).length;

      if (openParen !== closeParen) {
        throw new Error("SyntaxError: Unmatched parentheses in print statement");
      }

      const match = code.match(/print\s*\(\s*['\"]([^'\"]+)['\"]\s*\)/);
      const outputText = match ? match[1] : "Hello, World!";
      setOutput(`${outputText}\n>>> Program finished with exit code 0`);
    } catch (error) {
      setOutput(`Error: ${error.message}\n>>> Program failed with exit code 1`);
    }
  };

  const handleOpenModal = () => {
    console.log("Open sign in modal");
  };

  return (
    <div className={styles["python-exercise-page"]}>
      <Header onOpenModal={handleOpenModal} />

      <div className={styles["codex-fullscreen"]}>
        {/* === PROGRESS BAR === */}
        <div className={styles["lesson-progress"]}>
          <h2 className={styles["lesson-stage"]}>⚙️ Setting up</h2>
          <div className={styles["progress-bar"]}>
            <div
              className={styles["progress-fill"]}
              style={{ width: "8.33%" }}
            ></div>
          </div>
          <p className={styles["progress-text"]}>Lesson 1 of 12</p>
        </div>

        <div className={styles["main-layout"]}>
          {/* Left Side - Game Preview */}
          <div className={styles["game-container"]}>
            <div className={styles["game-preview"]}>
              <div className={styles["game-scene"]}>
                <img
                  alt="Game background"
                  className={styles["game-bg"]}
                />
                <img
                  src="https://www.freepngimg.com/thumb/rpg/3-2-rpg-png-6.png"
                  alt="Character"
                  className={styles["game-character"]}
                />
              </div>

              {/* Dialogue Box */}
              <div
                className={styles["dialogue-box"]}
                onClick={handleNextDialogue}
              >
                <p className={styles["dialogue-text"]}>
                  {displayedText}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Code Editor and Terminal */}
          <div className={styles["code-container"]}>
            <div className={styles["code-editor"]}>
              <div className={styles["editor-header"]}>
                <span>script.py</span>
                <button className={styles["run-btn"]} onClick={handleRunCode}>
                  <Play size={16} /> Run
                </button>
              </div>
              <textarea
                className={styles["code-box"]}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              ></textarea>
            </div>

            <div className={styles["terminal"]}>
              <div className={styles["terminal-header"]}>Terminal</div>
              <div className={styles["terminal-body"]}>
                <div className={styles["terminal-line"]}>
                  <span className={styles["prompt"]}>$</span> python script.py
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

        {/* Help Section */}
        <h3 className={styles["help-title"]}>Help</h3>
        <div className={styles["help-section"]}>
          <div
            className={styles["help-header"]}
            onClick={() => setShowHelp((prev) => !prev)}
          >
            <span>💡 Hint</span>
            <span className={styles["help-arrow"]}>{showHelp ? "▴" : "▾"}</span>
          </div>

          {showHelp && (
            <div className={styles["help-content"]}>
              <p>
                Remember: In Python, <code>print()</code> displays text on the screen.
              </p>
              <p>
                Example: <code>print("Hello, World!")</code>
              </p>
              <p>
                Try changing the text to <code>"Hi"</code> or your name and press{" "}
                <b>Run</b> to test it!
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PythonExercise;
