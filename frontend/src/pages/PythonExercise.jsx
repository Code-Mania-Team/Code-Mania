import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import XpNotification from "../components/XpNotification";
import styles from "../styles/PythonExercise.module.css";
import { initPhaserGame } from "../engine/main.js";
import exercises from "../data/pythonExercises.json";

const PythonExercise = ({ isAuthenticated, onOpenModal, onSignOut }) => {
  const { exerciseId } = useParams();
  const [currentExercise, setCurrentExercise] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showXpPanel, setShowXpPanel] = useState(false);

  // Load exercise data
  useEffect(() => {
    if (exerciseId) {
      // Extract the numeric ID from the URL parameter (e.g., "1-hello" -> 1)
      const id = parseInt(exerciseId.split('-')[0], 10);
      const exercise = exercises.find(ex => ex.id === id);
      if (exercise) {
        setCurrentExercise(exercise);
        setCode(exercise.startingCode || `# ${exercise.title}\n\n${exercise.startingCode || ''}`);
        setOutput("");
        setIsCompleted(false);
        setShowXpPanel(false);
      }
    }
  }, [exerciseId]);

  // === Dialogue System ===
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const dialogues = currentExercise?.hints || [
    "Use the hints above if you get stuck during the exercise."
  ];

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

  // Run code without affecting XP/completion (used by the Run button)
  const handleRunPreview = () => {
    if (!currentExercise) return;
    
    // Basic validation for required elements in the code
    if (currentExercise.requirements?.mustInclude) {
      for (const required of currentExercise.requirements.mustInclude) {
        if (!code.includes(required)) {
          setOutput(`Error: Your code must include "${required}"`);
          return;
        }
      }
    }

    try {
      // For now, just show the expected output
      // In a real implementation, you'd want to actually execute the Python code
      setOutput(currentExercise.expectedOutput || "Code executed successfully!");
    } catch (error) {
      setOutput(`Error: ${error.message}\n>>> Program failed`);
    }
  };

  // Submit code and award XP if correct (used by the Submit button)
  const handleRunCode = () => {
    if (!currentExercise) return;
    
    // Basic validation for required elements in the code
    if (currentExercise.requirements?.mustInclude) {
      for (const required of currentExercise.requirements.mustInclude) {
        if (!code.includes(required)) {
          setOutput(`Error: Your code must include "${required}"`);
          return;
        }
      }
    }

    try {
      // For now, just show the expected output
      // In a real implementation, you'd want to actually execute the Python code
      setOutput(currentExercise.expectedOutput || "Code executed successfully!");

      // Mark exercise as completed and show XP notification
      if (!isCompleted) {
        setIsCompleted(true);
        setShowXpPanel(true);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}\n>>> Program failed`);
      setIsCompleted(false);
      setShowXpPanel(false);
    }
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

  // Navigation between exercises
  const navigateToExercise = (direction) => {
    if (!currentExercise) return;
    
    const currentIndex = exercises.findIndex(ex => ex.id === currentExercise.id);
    if (currentIndex === -1) return;
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % exercises.length;
    } else {
      nextIndex = (currentIndex - 1 + exercises.length) % exercises.length;
    }
    
    const nextExercise = exercises[nextIndex];
    window.location.href = `/learn/python/exercise/${nextExercise.id}-${nextExercise.title.toLowerCase().replace(/\s+/g, '-')}`;
  };

  useEffect(() => {
    const game = initPhaserGame("phaser-container");

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
        <ProgressBar 
          currentLesson={currentExercise?.id || 1} 
          totalLessons={exercises.length} 
          title={currentExercise?.lessonHeader || "🐍 Python Exercise"} 
        />

        <div className={styles["main-layout"]}>
          {/* === LEFT SIDE: Phaser Game === */}
          <div className={styles["game-container"]}>
            <div className={styles["game-preview"]}>
              {/* Phaser mounts here */}
              <div
                id="phaser-container"
                className={`${styles["game-scene"]} ${showScroll ? styles["game-blur"] : ""}`}
              />
              
              {/* Button to show scroll */}
              {!showScroll && (
                <button
                  className={styles["lesson-button"]}
                  onClick={() => setShowScroll(true)}
                >
                  📜 View Lesson
                </button>
              )}

              {showScroll && (
                <div className={styles["scroll-container"]}>
                  <img
                    src="/src/assets/aseprites/scroll.png"
                    alt="Scroll"
                    className={styles["scroll-image"]}
                  />

                  <div className={styles["scroll-content"]}>
                    <h2>{currentExercise?.title || 'Python Exercise'}</h2>
                    <p>{currentExercise?.description || 'Complete the exercise by writing code in the editor.'}</p>
                    
                    {currentExercise?.bullets && (
                      <ul>
                        {currentExercise.bullets.map((bullet, index) => (
                          <li key={index}>• {bullet}</li>
                        ))}
                      </ul>
                    )}

                    {currentExercise?.lessonExample && (
                      <>
                        <p>Here's an example:</p>
                        <div className={styles["code-example"]}>
                          <pre>
                            <code>{currentExercise.lessonExample}</code>
                          </pre>
                        </div>
                      </>
                    )}
                    
                    <div className={styles["exercise-navigation"]}>
                      <button 
                        onClick={() => navigateToExercise('prev')}
                        className={styles["nav-button"]}
                      >
                        ← Previous
                      </button>
                      <span>Exercise {currentExercise?.id || '?'} of {exercises.length}</span>
                      <button 
                        onClick={() => navigateToExercise('next')}
                        className={styles["nav-button"]}
                      >
                        Next →
                      </button>
                    </div>
                    
                    <p>Try writing your own code in the editor! 👉</p>
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
                  className={`${styles["run-btn"]} ${
                    !showScroll ? styles["disabled-btn"] : ""
                  }`}
                  onClick={handleRunPreview}
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
              <div className={styles["terminal-header"]}>
                Terminal
                <button
                  className={`${styles["submit-btn"]} ${
                    !showScroll ? styles["disabled-btn"] : ""
                  }`}
                  onClick={handleRunCode}
                  disabled={!showScroll}
                  title={!showScroll ? "View the lesson first" : "Submit code"}
                >
                  Submit
                </button>
              </div>
              <div className={styles["terminal-body"]}>
                {output && (
                  <div className={styles["terminal-output"]}>{output}</div>
                )}
                <div className={styles["terminal-line"]}>
                  <span className={styles["prompt"]}>$</span>
                  <span className={styles["cursor"]}></span>
                </div>
              </div>
            </div>
            <XpNotification
              show={showXpPanel}
              onClose={() => setShowXpPanel(false)}
              onNext={() => navigateToExercise('next')}
            />
          </div>
        </div>

        <h3 className={styles["help-title"]}>Help</h3>
        <div className={styles["help-section"]}>
          <div
            className={styles["help-header"]}
            onClick={() => setShowHelp((prev) => !prev)}
          >
            <span>💡 Hint</span>
            <span className={styles["help-arrow"]}>
              {showHelp ? "▴" : "▾"}
            </span>
          </div>

          {showHelp && (
            <div
              className={styles["dialogue-terminal"]}
              onClick={handleNextDialogue}
            >
              <div className={styles["terminal-line"]}>
                <span className={styles["dialogue-text"]}>
                  {displayedText}
                  <span className={styles["cursor"]}></span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PythonExercise;
