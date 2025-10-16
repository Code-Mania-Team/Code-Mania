import React, { useState } from "react";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./PythonExercise.module.css"; // ✅ Scoped CSS Modules import

const PythonExercise = () => {
  const [code, setCode] = useState(`# Write code below ❤️
print("Hello, World!")`);
  const [output, setOutput] = useState("");

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

        {/* === MAIN GRID === */}
        <div className={styles["codex-grid"]}>
          {/* Game Preview */}
          <div className={styles["game-preview"]}>
            <h3>🕹️ Game Preview</h3>
            <div className={styles["preview-box"]}>
              [ Game Screen Placeholder ]
            </div>
          </div>

          {/* Code Editor */}
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

          {/* Lesson Section */}
          <div className={styles["lesson-section"]}>
            <h2 className={styles["lesson-title"]}># Python</h2>
            <p className={styles["lesson-text"]}>
              Welcome to the first chapter of <b>The Legend of Python!</b> 🐍
              <br />
              The programming language we are learning is called <b>Python</b>,
              created by <b>Guido van Rossum</b> in the early 90s.
            </p>
            <p className={styles["lesson-text"]}>
              Python is designed to be easy for us to read, which makes it the
              perfect coding language for beginners.
            </p>

            <h3>It’s used in the following areas:</h3>
            <ul>
              <li>• Data analysis & visualization</li>
              <li>• Artificial intelligence (AI)</li>
              <li>• Machine learning (ML)</li>
              <li>• Web development</li>
              <li>• And more!</li>
            </ul>

            <p className={styles["lesson-footer"]}>
              All the code we write in this course will be in Python files (.py).
              <br />
              There’s a code editor on the right side, created just for you. 💻
            </p>
          </div>

          {/* Terminal */}
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

      <Footer />
    </div>
  );
};

export default PythonExercise;
