import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import styles from "../styles/PythonExercise.module.css";
import map1 from "../assets/aseprites/map1.png"; // Import the map1 image
import characterIdle from "../assets/aseprites/Idle-Sheet.png";
import walkDown from "../assets/aseprites/walkdown-Sheet.png";
import walkLeft from "../assets/aseprites/walkleft-Sheet.png";
import walkRight from "../assets/aseprites/walkright-Sheet.png";
import walkUp from "../assets/aseprites/walkup-Sheet.png";
import monsterImage from "../assets/aseprites/gloo.png";

const PythonExercise = ({ isAuthenticated, onOpenModal, onSignOut }) => {
  const [code, setCode] = useState(`# Write code below ❤️

print("Hello, World!")`);
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  
  // Monster state
  const [monster] = useState({
    x: 600,
    y: 200,
    width: 80,
    height: 80,
    // Reduced detection radius to make the scroll appear only when very close
    detectionRadius: 50 // How close the character needs to be to show scroll
  });

  // === Dialogue System ===
  const dialogues = [
    "Remember to check the hints if you get stuck during the course. But for this exercise, you don't have to know what's going on with the code – just copy and paste it.",
  ];
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Character state
  const [character, setCharacter] = useState({
    x: 100,
    y: 100,
    direction: 'down',
    isMoving: false,
    sprite: characterIdle,
    frame: 0,
    frameCount: 4, // 4 frames per animation
    frameDuration: 200, // ms per frame
    lastUpdate: 0,
    // Add these for smoother animation
    animationTimer: 0,
    frameProgress: 0,
    // Sprite dimensions - increased size
    spriteWidth: 100,
    spriteHeight: 100,
    scale: 1 // Scale factor for the character
  });
  
  const [keys, setKeys] = useState({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
  });
  const moveSpeed = 3; // Increased move speed to compensate for larger character

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
      setOutput(`${outputText}\n`);
    } catch (error) {
      setOutput(`Error: ${error.message}\n>>> Program failed`);
    }
  };

  // Authentication state is managed in App.jsx and passed down through props
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

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keys.hasOwnProperty(e.key)) {
        // Prevent default to stop page scrolling with arrow keys
        e.preventDefault();
        setKeys(prev => ({ ...prev, [e.key]: true }));
      }
    };

    const handleKeyUp = (e) => {
      if (keys.hasOwnProperty(e.key)) {
        e.preventDefault();
        setKeys(prev => ({ ...prev, [e.key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keys]);

  // Check for collisions or proximity to objects using requestAnimationFrame
  useEffect(() => {
    let animationFrameId;
    let lastTime = 0;
    const checkInterval = 50; // Check every 50ms for better responsiveness

    const checkProximity = (timestamp) => {
      if (!lastTime || timestamp - lastTime >= checkInterval) {
        lastTime = timestamp;
        
        // Calculate distance between character and monster
        const charCenterX = character.x + character.spriteWidth / 2;
        const charCenterY = character.y + character.spriteHeight / 2;
        const monsterCenterX = monster.x + monster.width / 2;
        const monsterCenterY = monster.y + monster.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(charCenterX - monsterCenterX, 2) + 
          Math.pow(charCenterY - monsterCenterY, 2)
        );

        // Show scroll if character is near the monster
        setShowScroll(distance < monster.detectionRadius);
      }
      
      animationFrameId = requestAnimationFrame(checkProximity);
    };

    animationFrameId = requestAnimationFrame(checkProximity);
    return () => cancelAnimationFrame(animationFrameId);
  }, [character, monster]);

  // Animation and movement loop
  useEffect(() => {
    let animationFrameId;
    let lastTimestamp = 0;
    const frameTime = 100; // Time per frame in ms

    const updateCharacter = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      setCharacter(prev => {
        let { x, y, direction, frame, lastUpdate, isMoving, animationTimer } = prev;
        let newX = x;
        let newY = y;
        let newDirection = direction;
        let newIsMoving = false;
        let newFrame = frame;
        let newLastUpdate = lastUpdate;
        let newAnimationTimer = animationTimer + deltaTime;
        let sprite = characterIdle;

        // Handle movement
        if (keys.ArrowUp) {
          newY = Math.max(0, y - moveSpeed);
          newDirection = 'up';
          newIsMoving = true;
          sprite = walkUp;
        } else if (keys.ArrowDown) {
          newY = Math.min(350 - 64, y + moveSpeed);
          newDirection = 'down';
          newIsMoving = true;
          sprite = walkDown;
        }
        
        if (keys.ArrowLeft) {
          newX = Math.max(0, x - moveSpeed);
          newDirection = 'left';
          newIsMoving = true;
          sprite = walkLeft;
        } else if (keys.ArrowRight) {
          newX = Math.min(600 - 32, x + moveSpeed);
          newDirection = 'right';
          newIsMoving = true;
          sprite = walkRight;
        }

        // Update animation frame
        if (newIsMoving) {
          // Only update frame every frameTime milliseconds
          if (newAnimationTimer >= frameTime) {
            newFrame = (frame + 4) % prev.frameCount;
            newAnimationTimer = 0; // Reset the timer
          }
        } else {
          newFrame = 0; // Reset to first frame when not moving
          newAnimationTimer = 0;
        }

        return {
          ...prev,
x: newX,
          y: newY,
          direction: newDirection,
          isMoving: newIsMoving,
          sprite,
          frame: newFrame,
          lastUpdate: newLastUpdate,
          animationTimer: newAnimationTimer
        };
      });

      animationFrameId = requestAnimationFrame(updateCharacter);
    };

    animationFrameId = requestAnimationFrame(updateCharacter);
    return () => cancelAnimationFrame(animationFrameId);
  }, [keys]);

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
                {/* Monster - Only show when scroll is not visible */}
                {!showScroll && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: `${monster.x}px`,
                      top: `${monster.y}px`,
                      width: `${monster.width}px`,
                      height: `${monster.height}px`,
                      backgroundImage: `url(${monsterImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center',
                      zIndex: 5,
                      transform: 'scale(1.5)'
                    }}
                  />
                )}

                {/* Character Sprite - Only show when scroll is not visible */}
                {!showScroll && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: `${character.x}px`,
                      top: `${character.y}px`,
                      width: `${character.spriteWidth}px`,
                      height: `${character.spriteHeight}px`,
                      backgroundImage: `url(${character.sprite})`,
                      backgroundPosition: `-${character.frame * (character.spriteWidth / character.scale)}px 0`,
                      backgroundSize: `${(character.spriteWidth * character.frameCount) / character.scale}px ${character.spriteHeight / character.scale}px`,
                      imageRendering: 'pixelated',
                      zIndex: 10,
                      transform: `scale(${character.scale})`,
                      transformOrigin: 'top left',
                      willChange: 'transform'
                    }}
                  />
                )}

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
                        Welcome to the first chapter of <strong>The Legend of Python!</strong><br />
                        Python is a beginner-friendly language created by{" "}
                        <a href="https://en.wikipedia.org/wiki/Guido_van_Rossum" target="_blank" rel="noreferrer">
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
          </div>

          {/* Right Side - Code Editor and Terminal */}
          <div className={styles["code-container"]}>
            <div className={styles["code-editor"]}>
              <div className={styles["editor-header"]}>
                <span>script.py</span>
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
                Terminal
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
                  <span className={styles["prompt"]}>$</span>
                  <span className={styles["cursor"]}></span>
                </div>
              </div>
            </div>
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

export default PythonExercise;