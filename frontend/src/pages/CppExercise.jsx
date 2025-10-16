import React, { useState } from "react";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import styles from "./CppExercise.module.css"; // ✅ Scoped CSS Module import

const CppExercise = () => {
  const [code, setCode] = useState(`// Write your C++ code below
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setOutput("Compiling and running C++ code...\n");

      // Simulated backend compile/run
      setTimeout(() => {
        try {
          if (code.includes("cout") || code.includes("printf")) {
            const match = code.match(/["']([^"']+)["']/);
            const outputText = match ? match[1] : "Hello, C++!";
            setOutput(
              (prev) =>
                prev + `${outputText}\n>>> Program finished with exit code 0`
            );
          } else {
            setOutput(
              (prev) =>
                prev +
                "No output detected. Did you include a print statement?\n>>> Program finished with exit code 0"
            );
          }
        } catch (error) {
          setOutput(
            (prev) =>
              prev + `\nError: ${error.message}\n>>> Program failed with exit code 1`
          );
        } finally {
          setIsRunning(false);
        }
      }, 1000);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setIsRunning(false);
    }
  };

  const handleOpenModal = () => {
    console.log("Open sign in modal");
  };

  return (
    <div className={styles["cpp-exercise-page"]}>
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
              [ C++ Game Screen Placeholder ]
            </div>
          </div>

          {/* Code Editor */}
          <div className={styles["code-editor"]}>
            <div className={styles["editor-header"]}>
              <span>main.cpp</span>
              <button
                className={`${styles["run-btn"]} ${
                  isRunning ? styles["running"] : ""
                }`}
                onClick={handleRunCode}
                disabled={isRunning}
              >
                {isRunning ? (
                  <span className={styles["loading-spinner"]}></span>
                ) : (
                  <Play size={16} />
                )}
                {isRunning ? "Running..." : "Run"}
              </button>
            </div>
            <textarea
              className={styles["code-box"]}
              value={code}
              onChange={(e) => setCode(e.target.value)} // ✅ fixed e.targetValue bug
              spellCheck="false"
            ></textarea>
          </div>

          {/* Lesson Section */}
          <div className={styles["lesson-section"]}>
            <h2 className={styles["lesson-title"]}># C++</h2>
            <p className={styles["lesson-text"]}>
              Welcome to the first chapter of <b>The Legend of C++!</b> 🚀 <br />
              C++ is a powerful general-purpose programming language created by{" "}
              <b>Bjarne Stroustrup</b> as an extension of the C programming
              language.
            </p>
            <p className={styles["lesson-text"]}>
              C++ is known for its high performance and is widely used in systems
              programming, game development, and other performance-critical
              applications.
            </p>

            <h3>Key Features of C++:</h3>
            <ul>
              <li>• High performance and efficient memory management</li>
              <li>• Object-oriented programming support</li>
              <li>• Standard Template Library (STL)</li>
              <li>
                • Used in game engines, operating systems, and high-frequency
                trading
              </li>
              <li>• Strong community and industry support</li>
            </ul>

            <p className={styles["lesson-footer"]}>
              All the code we write in this course will be in C++ files (.cpp).
              <br />
              There’s a code editor on the right side, created just for you. 💻
            </p>
          </div>

          {/* Terminal */}
          <div className={styles["terminal"]}>
            <div className={styles["terminal-header"]}>Terminal</div>
            <div className={styles["terminal-body"]}>
              <div className={styles["terminal-line"]}>
                <span className={styles["prompt"]}>$</span> g++ main.cpp -o main
                && ./main
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

export default CppExercise;
