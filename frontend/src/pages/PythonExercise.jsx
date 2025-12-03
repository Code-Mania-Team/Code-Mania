import React, { useState, useEffect } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import CodeTerminal from "../components/CodeTerminal";
import styles from "../styles/PythonExercise.module.css";
import { initPhaserGame } from "../engine/main.js";

const PythonExercise = ({ isAuthenticated, onOpenModal, onSignOut }) => {
  const [code, setCode] = useState(`# Write code below ❤️

print("Hello, World!")`);
  const [output, setOutput] = useState("");
  const [showScroll, setShowScroll] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const game = initPhaserGame("phaser-container");
    setTimeout(() => setShowScroll(true), 1500);
    return () => {
      if (game) game.cleanup();
    };
  }, []);

  const handleRunCode = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setOutput("Running...");
    
    try {
      const response = await fetch("http://localhost:3000/v1/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": "hotdog" },
        body: JSON.stringify({
          code: code,
          language: "python"
        })
      });

      const data = await response.json();
      setOutput(data.output || data.error || "No output");
    } catch (err) {
      setOutput("Error connecting to server");
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  // === Sign-in modal handling ===
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsSignInModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSignInModalOpen(false);
  };

  const handleSignInSuccess = () => {
    handleCloseModal();
  };

  return (
    <div className={styles["python-exercise-page"]}>
      <div className={styles["scroll-background"]}></div>
      <Header onOpenModal={isAuthenticated ? null : handleOpenModal} />

      {isSignInModalOpen && (
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={handleCloseModal}
          onSignInSuccess={handleSignInSuccess}
        />
      )}

      <div className={styles["codex-fullscreen"]}>
        <ProgressBar currentLesson={1} totalLessons={12} title="🐍 Python Basics" />

        <div className={styles["main-layout"]}>
          {/* === LEFT SIDE: Phaser Game === */}
          <div className={styles["game-container"]}>
            <div className={styles["game-preview"]}>
              {/* Phaser mounts here */}
              <div
                id="phaser-container"
                className={styles["game-scene"]}
                
              />

              {showScroll && (
                <div className={styles["scroll-container"]}>
                  <img
                    src="/src/assets/aseprites/scroll.png"
                    alt="Scroll"
                    className={styles["scroll-image"]}
                  />

                  <div className={styles["scroll-content"]}>
                    <h2>🐍 Python</h2>
                    <p>
                      Welcome to the first chapter of{" "}
                      <strong>The Legend of Python!</strong>
                      <br />
                      Python is a beginner-friendly language created by{" "}
                      <a
                        href="https://en.wikipedia.org/wiki/Guido_van_Rossum"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Guido van Rossum
                      </a>{" "}
                      in the early 90s.
                    </p>
                    <ul>
                      <li>• Artificial Intelligence</li>
                      <li>• Web Development</li>
                      <li>• Data Analysis</li>
                      <li>• Machine Learning</li>
                    </ul>
                    <p>Let's give it a try! Here's a simple Python example:</p>
                    <div className={styles["code-example"]}>
                      <pre>
                        <code>
                          {`# This is a simple Python function
print("Hi")

This should appear in the Terminal window:
Hi`}
                        </code>
                      </pre>
                    </div>
                    <p>Try writing your own code on the right! 👉</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* === RIGHT SIDE: Code Editor and Terminal === */}
          <CodeTerminal
            code={code}
            onCodeChange={handleCodeChange}
            onRun={handleRunCode}
            output={output}
            isRunning={isRunning}
            showRunButton={showScroll}
            disabled={!showScroll}
            disabledMessage="View the lesson first"
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PythonExercise;