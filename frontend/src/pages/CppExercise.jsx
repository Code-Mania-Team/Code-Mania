import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import styles from "../styles/CppExercise.module.css";
import map1 from "../assets/aseprites/map1.png";

const CppExercise = () => {
  const [code, setCode] = useState(`// Write your C++ code below ❤️
#include <iostream>
using namespace std;

int main() {
  cout << "Hello, World!" << endl;
  return 0;
}`);
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const [showScroll, setShowScroll] = useState(false);

  const handleRunCode = () => {
    setOutput("Compiling and running main.cpp...\n");
    setTimeout(() => {
      if (code.includes("cout")) {
        const match = code.match(/"([^"]+)"/);
        const text = match ? match[1] : "Hello, C++!";
        setOutput(`${text}\n>>> Program finished with exit code 0`);
      } else {
        setOutput(
          "No output detected. Did you include a cout statement?\n>>> Program finished with exit code 0"
        );
      }
    }, 1000);
  };

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
    <div className={styles["cpp-exercise-page"]}>
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
        <ProgressBar currentLesson={1} totalLessons={12} title="⚙️ Setting up" />

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
                    <div className={styles["scroll-content"]}>
                      <h2>🖥️ C++</h2>
                      <p>
                        Welcome to the first chapter of <strong>The Legend of C++!</strong><br />
                        C++ is a powerful language created by{" "}
                        <a href="https://en.wikipedia.org/wiki/Bjarne_Stroustrup" target="_blank" rel="noreferrer">
                          Bjarne Stroustrup
                        </a>{" "}
                        as an extension of the C programming language.
                      </p>
                      <ul>
                        <li>• Game Development</li>
                        <li>• System Software</li>
                        <li>• High-Performance Applications</li>
                        <li>• Embedded Systems</li>
                      </ul>
                      <p>Let's give it a try! Here's a simple C++ example:</p>
                      <div className={styles["code-example"]}>
                        <pre>
                          <code>
                            {`#include <iostream>
using namespace std;

int main() {
  cout << "Hello, World!" << endl;
  return 0;
}

This should appear in the Terminal window:
Hello, World!`}
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
                <span>main.cpp</span>
                <button className={styles["run-btn"]} onClick={handleRunCode}>
                  <Play size={16} /> Run
                </button>
              </div>

              <textarea
                className={styles["code-box"]}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
              ></textarea>
            </div>

            <div className={styles["terminal"]}>
              <div className={styles["terminal-header"]}>Terminal</div>
              <div className={styles["terminal-body"]}>
                <div className={styles["terminal-line"]}>
                  <span className={styles["prompt"]}>$</span> g++ main.cpp -o main && ./main
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
            <div className={styles['help-content']}>
              <h3 className={styles['help-title']}>C++ Quick Reference</h3>
              <p>Here's a quick guide to get you started with C++:</p>
              
              <h4>Basic Structure</h4>
              <pre>{
`#include <iostream>
using namespace std;

int main() {
  // Your code here
  return 0;
}`}
              </pre>

              <h4>Printing Output</h4>
              <pre>{
`cout << "Hello, World!" << endl;  // Prints with newline
cout << "No newline";            // Prints without newline`}
              </pre>

              <h4>Variables</h4>
              <pre>{
`int number = 10;          // Integer
float decimal = 3.14f;    // Floating point
double precise = 3.14159; // Double precision
char letter = 'A';        // Single character
bool isTrue = true;       // Boolean`}
              </pre>

              <h4>User Input</h4>
              <pre>{
`int age;
cout << "Enter your age: ";
cin >> age;`}
              </pre>
            </div>
          )}
        </div>
        
        <Footer />
      </div>
  );
};

export default CppExercise;
