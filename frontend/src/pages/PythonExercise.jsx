import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import CodeTerminal from "../components/CodeTerminal";
import MobileControls from "../components/MobileControls";
import styles from "../styles/PythonExercise.module.css";
import { initPhaserGame } from "../utilities/engine/main.js";
import pythonExercises from "../utilities/data/pythonExercises.json";
import mobileFrame from "../assets/mobile.png";

const PythonExercise = ({ isAuthenticated, onOpenModal, onSignOut }) => {
  const { exerciseId } = useParams();
  const [activeExerciseId, setActiveExerciseId] = useState(() => {
    const initialId = Number(exerciseId);
    return Number.isFinite(initialId) && initialId > 0 ? initialId : 1;
  });

  const activeExercise = useMemo(() => {
    const found = pythonExercises.find((e) => e.id === activeExerciseId);
    return found || pythonExercises[0];
  }, [activeExerciseId]);

  const [code, setCode] = useState(() => {
    return (
      pythonExercises.find((e) => e.id === activeExerciseId)?.startingCode ||
      `# Write code below ❤️\n\nprint("Hello, World!")`
    );
  });
  const [output, setOutput] = useState("");
  const [showScroll, setShowScroll] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const newId = Number(exerciseId);
    if (Number.isFinite(newId) && newId > 0) {
      setActiveExerciseId(newId);
    }
  }, [exerciseId]);

  useEffect(() => {
    if (activeExercise?.startingCode) {
      setCode(activeExercise.startingCode);
      setOutput("");
    }
    setShowScroll(false);
  }, [activeExerciseId]);

  useEffect(() => {
    const game = initPhaserGame("phaser-container");

    const handleDialogueComplete = (event) => {
      const questId =
        event && typeof event === "object" && "detail" in event
          ? event.detail?.questId
          : undefined;

      if (Number.isFinite(Number(questId))) {
        const nextId = Number(questId);
        if (pythonExercises.some((e) => e.id === nextId)) {
          setActiveExerciseId(nextId);
        }
      }
      setShowScroll(true);
    };

    window.addEventListener("code-mania:dialogue-complete", handleDialogueComplete);
    return () => {
      window.removeEventListener(
        "code-mania:dialogue-complete",
        handleDialogueComplete
      );
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
    localStorage.setItem('isAuthenticated', 'true');
    window.dispatchEvent(new Event('authchange'));
    handleCloseModal();
  };

  return (
    <div className={styles["python-exercise-page"]}>
      <div className={styles["scroll-background"]}></div>
      <Header isAuthenticated={isAuthenticated} onOpenModal={isAuthenticated ? null : handleOpenModal} />

      {isSignInModalOpen && (
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={handleCloseModal}
          onSignInSuccess={handleSignInSuccess}
        />
      )}

      <div className={styles["codex-fullscreen"]}>
        <ProgressBar
          currentLesson={activeExercise?.id || 1}
          totalLessons={pythonExercises.length}
          title="🐍 Python Basics"
        />

        <div className={styles["main-layout"]}>
          {/* === LEFT SIDE: Phaser Game === */}
          <div className={styles["game-container"]}>
            <div className={styles["game-preview"]}>
              <div className={styles["mobile-frame"]}>
                <img
                  src={mobileFrame}
                  alt="Mobile Frame"
                  className={styles["mobile-frame-image"]}
                />

                <div className={styles["mobile-controls"]}>
                  <MobileControls />
                </div>

                <div className={styles["mobile-screen"]}>
                  {/* Phaser mounts here */}
                  <div
                    id="phaser-container"
                    className={styles["game-scene"]}
                  >
                    {showScroll && (
                      <div className={styles["scroll-container"]}>
                        <img
                          src="/src/assets/aseprites/scroll.png"
                          alt="Scroll"
                          className={styles["scroll-image"]}
                        />

                        <div className={styles["scroll-content"]}>
                          <h2>{activeExercise?.lessonHeader || "🐍 Python"}</h2>
                          <p>{activeExercise?.description || ""}</p>

                          {Array.isArray(activeExercise?.hints) && activeExercise.hints.length > 0 && (
                            <ul>
                              {activeExercise.hints.map((hint, idx) => (
                                <li key={idx}>{hint}</li>
                              ))}
                            </ul>
                          )}

                          {activeExercise?.lessonExample && (
                            <div className={styles["code-example"]}>
                              <pre>
                                <code>{activeExercise.lessonExample}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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