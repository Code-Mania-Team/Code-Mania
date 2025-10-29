import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import styles from "../styles/PythonExercise.module.css";
import map1 from "../assets/aseprites/map1.png"; // Import the map1 image

const PythonExercise = () => {
  const [code, setCode] = useState(`# Write code below ❤️

print("Hello, World!")`);
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  // === Dialogue System ===
  const dialogues = [
    "Remember to check the hints if you get stuck during the course. But for this exercise, you don't have to know what's going on with the code – just copy and paste it.",
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
      setOutput(`${outputText}\n`);
    } catch (error) {
      setOutput(`Error: ${error.message}\n>>> Program failed`);
    }
  };

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleOpenModal = () => {
    setIsSignInModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSignInModalOpen(false);
  };

  const handleSignInSuccess = () => {
    // In a real app, you would get user data from your auth provider
    const mockUser = { name: 'Coder', email: 'coder@example.com' };
    setUser(mockUser);
    setIsAuthenticated(true);
    setIsSignInModalOpen(false);
  };

  return (
    <div className={styles["python-exercise-page"]}>
      <div className={styles["scroll-background"]}></div>
      <Header onOpenModal={isAuthenticated ? null : handleOpenModal} user={user} />
      
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