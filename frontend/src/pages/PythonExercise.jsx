import React, { useState } from "react";
import { Play } from "lucide-react";
import "./PythonExercise.css";

const PythonExercise = () => {
  const [code, setCode] = useState(`# Write code below ❤️
print("Hello, World!")`);
  const [output, setOutput] = useState("");

  const handleRunCode = () => {
    setOutput("Hello, World!\n>>> ");
  };

  return (
    <div className="python-exercise-page">
      <div className="codex-fullscreen">
        {/* === HEADER + PROGRESS BAR === */}
        <div className="lesson-progress">
          <h2 className="lesson-stage">⚙️ Setting up</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "8.33%" }}></div>
          </div>
          <p className="progress-text">Lesson 1 of 12</p>
        </div>

        {/* === MAIN GRID === */}
        <div className="codex-grid">
          {/* Game Preview */}
          <div className="game-preview">
            <h3>🕹️ Game Preview</h3>
            <div className="preview-box">[ Game Screen Placeholder ]</div>
          </div>

          {/* Code Editor */}
          <div className="code-editor">
            <div className="editor-header">
              <span>script.py</span>
              <button className="run-btn" onClick={handleRunCode}>
                <Play size={16} /> Run
              </button>
            </div>
            <textarea
              className="code-box"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            ></textarea>
          </div>

          {/* Lesson Section */}
          <div className="lesson-section">
            <h2 className="lesson-title"># Python</h2>
            <p className="lesson-text">
              Welcome to the first chapter of <b>The Legend of Python!</b> 🐍 <br />
              The programming language we are learning is called <b>Python</b>,
              created by <b>Guido van Rossum</b> in the early 90s.
            </p>
            <p className="lesson-text">
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

            <p className="lesson-footer">
              All the code we write in this course will be in Python files (.py). <br />
              There’s a code editor on the right side, created just for you. 💻
            </p>
          </div>

          {/* Terminal */}
          <div className="terminal">
            <div className="terminal-header">Terminal</div>
            <div className="terminal-body">
              <div className="terminal-line">
                <span className="prompt">$</span> python script.py
              </div>
              {output && <div className="terminal-output">{output}</div>}
              <div className="terminal-line">
                <span className="prompt">$</span>
                <span className="cursor"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PythonExercise;
