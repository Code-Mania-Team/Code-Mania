import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import XpNotification from "../components/XpNotification";
import styles from "../styles/JavaScriptExercise.module.css";
import map1 from "../assets/aseprites/map1.png";
import exercises from "../data/javascriptExercises.json";
import { useProfile } from "../hooks/useProfile";


const JavaScriptExercise = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [currentExercise, setCurrentExercise] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [showXpPanel, setShowXpPanel] = useState(false);
  const { profile, loading, isAuthenticated } = useProfile();

  // === Dialogue System ===
  const dialogues = [
    "Remember to check the hints if you get stuck during the course. But for this exercise, you don't have to know what's going on with the code – just copy and paste it.",
  ];
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Load exercise data and reset state when exerciseId changes
  useEffect(() => {
    if (exerciseId) {
      const id = parseInt(exerciseId.split('-')[0], 10);
      const exercise = exercises.find(ex => ex.id === id);
      if (exercise) {
        setCurrentExercise(exercise);
        setCode(exercise.startingCode || `// ${exercise.title}\n\n${exercise.startingCode || ''}`);
        setOutput("");
        setShowHelp(false);
        setShowXpPanel(false);
      }
    }
  }, [exerciseId]);

  // Navigation functions
  const goToNextExercise = () => {
    if (!currentExercise) return;
    const nextId = currentExercise.id + 1;
    if (nextId <= exercises.length) {
      const nextExercise = exercises[nextId - 1];
      const exerciseSlug = nextExercise.title.toLowerCase().replace(/\s+/g, '-');
      navigate(`/learn/javascript/exercise/${nextId}-${exerciseSlug}`);
    }
  };

  const goToPrevExercise = () => {
    if (!currentExercise) return;
    const prevId = currentExercise.id - 1;
    if (prevId >= 1) {
      const prevExercise = exercises[prevId - 1];
      const exerciseSlug = prevExercise.title.toLowerCase().replace(/\s+/g, '-');
      navigate(`/learn/javascript/exercise/${prevId}-${exerciseSlug}`);
    }
  };

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
          setOutput(`${logs.join("\n")}\n`);
          setShowXpPanel(true);
        } else {
          setOutput(
            "No output detected. Did you include a console.log() statement?\n"
          );
          setShowXpPanel(false);
        }
      } catch (error) {
        setOutput(
          `Error: ${error.message}\n>>> Program failed`
        );
        setShowXpPanel(false);
      }
    }, 500);
  };

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  
  const [user, setUser] = useState(null);

  const handleOpenModal = () => {
    setIsSignInModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSignInModalOpen(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    
    navigate('/');
  };
  const handleSignInSuccess = () => {
    // In a real app, you would get user data from your auth provider
    const mockUser = { name: 'Coder', email: 'coder@example.com' };
    setUser(mockUser);
    setIsAuthenticated(true);
    setIsSignInModalOpen(false);
  };

  return (
    <div className={styles["javascript-exercise-page"]}>
      <div className={styles["scroll-background"]}></div>
      <Header isAuthenticated={isAuthenticated} onOpenModal={isAuthenticated ? null : handleOpenModal} user={user} onSignOut={handleSignOut}/>
      
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
          title="🌐 JavaScript Basics" 
        />

        <div className={styles["main-layout"]}>
          {/* Left Side - Game Preview */}
          <div className={styles["game-container"]}>
            <div className={styles["game-preview"]}>
              <div 
                className={styles["game-scene"]}
                style={{
                  backgroundImage: `url(${map1})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  minHeight: '400px',
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                {!showScroll && (
                  <button 
                    onClick={() => setShowScroll(true)}
                    className={styles["show-scroll-btn"]}
                  >
                    View Challenge
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
                      <h2>{currentExercise?.lessonHeader || '🌐 JavaScript'}</h2>
                      <p>{currentExercise?.description || 'Welcome to JavaScript exercises!'}</p>
                      
                      {currentExercise?.lessonExample && (
                        <div className={styles["code-example"]}>
                          <h3>Example:</h3>
                          <pre>{currentExercise.lessonExample}</pre>
                        </div>
                      )}
                      
                      <h3>Your Task:</h3>
                      <p>{currentExercise?.description || 'Complete the JavaScript code below.'}</p>
                      
                      <div className={styles.navigation}>
                        <button 
                          onClick={goToPrevExercise}
                          disabled={!currentExercise || currentExercise.id <= 1}
                          className={styles.navButton}
                        >
                          <ChevronLeft size={20} /> Previous
                        </button>
                        <span>Exercise {currentExercise?.id || 1} of {exercises.length}</span>
                        <button 
                          onClick={goToNextExercise}
                          disabled={!currentExercise || currentExercise.id >= exercises.length}
                          className={styles.navButton}
                        >
                          Next <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Side - Code Editor and Terminal */}
          <div className={styles["code-container"]}>
            <div className={styles["code-editor"]}>
              <div className={styles["editor-header"]}>
                <span>script.js</span>
                <button 
                  className={`${styles["run-btn"]} ${!showScroll ? styles["disabled-btn"] : ""}`} 
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
              <div className={styles["terminal-header"]}>
                Console
                <button 
                  className={`${styles["submit-btn"]} ${!showScroll ? styles["disabled-btn"] : ""}`}
                  onClick={handleRunCode}
                  disabled={!showScroll}
                  title={!showScroll ? "View the lesson first" : "Submit code"}
                >
                  Submit
                </button>
              </div>
              <div className={styles["terminal-body"]}>
                <div className={styles["terminal-line"]}>
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
            <XpNotification
              show={showXpPanel}
              onClose={() => setShowXpPanel(false)}
              onNext={goToNextExercise}
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
            <span className={styles["help-arrow"]}>{showHelp ? "▴" : "▾"}</span>
          </div>

          {showHelp && (
            <div 
              className={styles["dialogue-terminal"]}
              onClick={handleNextDialogue}
            >
              <div className={styles["terminal-line"]}>
                <span className={styles["prompt"]}></span>
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

export default JavaScriptExercise;