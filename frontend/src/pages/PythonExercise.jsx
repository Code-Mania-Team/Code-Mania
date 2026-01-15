import React, { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import styles from "../styles/PythonExercise.module.css";
import { initPhaserGame } from "../utilities/engine/main";
import Terminal from "../components/Terminal";

const PythonExercise = ({ isAuthenticated, onOpenModal, onSignOut }) => {
  const [code, setCode] = useState(`# Write code below ❤️

print("Hello, World!")`);
  const [showHelp, setShowHelp] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  // === Dialogue System ===
  const dialogues = [
    "Remember to check the hints if you get stuck during the course. But for this exercise, you don't have to know what's going on with the code – just copy and paste it.",
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
    }, 40);
  };

  // === Terminal Ref ===
  const terminalRef = useRef(null);

  // === Run button sends code to Terminal ===
  const handleRunCode = () => {
    if (terminalRef.current) {
      terminalRef.current.runCode(code);
    }
  };

  // === Sign-in modal handling ===
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const handleOpenModal = () => setIsSignInModalOpen(true);
  const handleCloseModal = () => setIsSignInModalOpen(false);
  const handleSignInSuccess = () => handleCloseModal();

  useEffect(() => {
    const game = initPhaserGame("phaser-container");
    setTimeout(() => setShowScroll(true), 1500);

    return () => {
      if (game) game.cleanup(); 
    };
  }, []);

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
              <div id="phaser-container" className={styles["game-scene"]} />

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
                      Welcome to the first chapter of <strong>The Legend of Python!</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* === RIGHT SIDE: Code Editor and Terminal === */}
          <div className={styles["code-container"]}>
            <div className={styles["code-editor"]}>
              <div className={styles["editor-header"]}>
                <span>script.py</span>
                <button
                  className={`${styles["submit-btn"]} ${!showScroll ? styles["disabled-btn"] : ""}`}
                  onClick={handleRunCode}
                  disabled={!showScroll}
                  title={!showScroll ? "View the lesson first" : "Run code"}
                >
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
              <div className={styles["terminal-header"]}>Interactive Terminal</div>
              <Terminal ref={terminalRef} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PythonExercise;