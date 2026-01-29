import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import StageCompleteModal from "../components/StageCompleteModal";
import XpNotification from "../components/XpNotification";
import styles from "../styles/JavaScriptExercise.module.css";
// Reusing CSS – you can replace with C++ styles if you add them
import cppStage1Badge from "../assets/badges/C++/c++-badges1.png";
import cppStage2Badge from "../assets/badges/C++/c++-badges2.png";
import cppStage3Badge from "../assets/badges/C++/c++-badge3.png";
import cppStage4Badge from "../assets/badges/C++/c++-badge4.png";
import exercises from "../utilities/data/cppExercises.json";
import { initPhaserGame } from "../utilities/engine/main.js";

const CppExercise = () => {
const { exerciseId } = useParams();
const navigate = useNavigate();
const location = useLocation();
const [currentExercise, setCurrentExercise] = useState(null);
const [code, setCode] = useState("");
const [output, setOutput] = useState("");
const [showHelp, setShowHelp] = useState(false);
const [showXpPanel, setShowXpPanel] = useState(false);
const [showStageComplete, setShowStageComplete] = useState(false);
const [, setXpEarned] = useState(0);

// === Dialogue System ===
const dialogues = [
"Use the hints if you get stuck. For now, just complete what the exercise asks."
];
const [currentDialogue, setCurrentDialogue] = useState(0);
const [displayedText, setDisplayedText] = useState("");
const [isTyping, setIsTyping] = useState(false);

// Load exercise data when route changes
useEffect(() => {
  const searchParams = new URLSearchParams(location.search);
  const forceStageComplete = searchParams.get("stageComplete") === "1";

  if (exerciseId) {
    const id = parseInt(exerciseId.split("-")[0], 10);
    if (isNaN(id)) {
      console.error('Invalid exercise ID');
      return;
    }
    
    // Set language for game scene
    localStorage.setItem("lastCourseTitle", "C++");
    
    // Set mapId based on current exercise number
    let mapId;
    if (id === 1) {
      mapId = "map1";
    } else if (id === 2) {
      mapId = "map2";
    } else if (id === 3) {
      mapId = "map3";
    } else {
      mapId = "map2"; // Default to map2 for exercises 4+
    }
    localStorage.setItem("currentMapId", mapId);
    
    const exercise = exercises.find((ex) => ex.id === id);
    if (!exercise) {
      console.error(`Exercise with ID ${id} not found`);
      return;
    }
    
    setCurrentExercise(exercise);
    setCode(
      exercise.startingCode ||
      `// ${exercise.title}\n\n${exercise.startingCode || ""}`
    );
    setOutput("");
    setShowHelp(false);
    setShowXpPanel(false);
    setShowStageComplete(forceStageComplete);
  }
}, [exerciseId, location.search]);

const stageNumber = currentExercise ? Math.floor((currentExercise.id - 1) / 4) + 1 : 1;
const lessonInStage = currentExercise ? ((currentExercise.id - 1) % 4) + 1 : 1;
const cppStageBadges = [cppStage1Badge, cppStage2Badge, cppStage3Badge, cppStage4Badge];
const isExam = Boolean(
  currentExercise &&
  ((currentExercise.title && currentExercise.title.toLowerCase().includes("exam")) ||
    (currentExercise.lessonHeader && currentExercise.lessonHeader.toLowerCase().includes("exam")))
);
const debugStageNumber = (() => {
  const searchParams = new URLSearchParams(location.search);
  const n = parseInt(searchParams.get("stage"), 10);
  return Number.isFinite(n) ? n : null;
})();
const displayStageNumber = debugStageNumber ?? stageNumber;

// Navigation functions
const goToNextExercise = () => {
if (!currentExercise) return;
const nextId = currentExercise.id + 1;
if (nextId <= exercises.length) {
const nextExercise = exercises[nextId - 1];
const exerciseSlug = nextExercise.title.toLowerCase().replace(/\s+/g, "-");
navigate(`/learn/cpp/exercise/${nextId}-${exerciseSlug}`);
}
};

const goToPrevExercise = () => {
if (!currentExercise) return;
const prevId = currentExercise.id - 1;
if (prevId >= 1) {
const prevExercise = exercises[prevId - 1];
const exerciseSlug = prevExercise.title.toLowerCase().replace(/\s+/g, "-");
navigate(`/learn/cpp/exercise/${prevId}-${exerciseSlug}`);
}
};

// Auto typing dialogue
useEffect(() => {
handleNextDialogue();
}, []);

useEffect(() => {
  const game = initPhaserGame("phaser-container");

  return () => {
    if (game) game.cleanup();
  };
}, [exerciseId]); // Restart game when exerciseId changes

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
setOutput("Running cpp...\n");
setTimeout(() => {
  try {
    // Capture console.log output
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    // Execute the code (in a real app, you'd send this to a backend)
    eval(code);

    // Restore console.log
    console.log = originalLog;

    const resultText = logs.length > 0
      ? `${logs.join("\n")}\n`
      : "Program ran successfully.\n";
    setOutput(resultText);

if (lessonInStage === 4) {
  setShowStageComplete(true);
  setShowXpPanel(false);
} else {
  setShowXpPanel(true);
  setShowStageComplete(false);
}
  } catch (error) {
    setOutput(
      `Error: ${error.message}\n>>> Program failed`
    );
    setShowXpPanel(false);
    setShowStageComplete(false);
  }
}, 500);
};

const handleStageContinue = () => {
  setShowStageComplete(false);
  setShowXpPanel(false);
  goToNextExercise();
};

// --- Auth modal setup ---
const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');
const [user, setUser] = useState(null);

const handleOpenModal = () => setIsSignInModalOpen(true);
const handleCloseModal = () => setIsSignInModalOpen(false);

const handleSignInSuccess = () => {
const mockUser = { name: "Coder", email: "[coder@example.com](mailto:coder@example.com)" };
setUser(mockUser);
setIsAuthenticated(true);
localStorage.setItem('isAuthenticated', 'true');
window.dispatchEvent(new Event('authchange'));
setIsSignInModalOpen(false);
};

return (
<div className={styles["javascript-exercise-page"]}>
<div className={styles["scroll-background"]}></div>
<Header
isAuthenticated={isAuthenticated}
onOpenModal={isAuthenticated ? null : handleOpenModal}
user={user}
/>
  {isSignInModalOpen && (
    <SignInModal
      isOpen={isSignInModalOpen}
      onClose={handleCloseModal}
      onSignInSuccess={handleSignInSuccess}
    />
  )}

  <div className={styles["codex-fullscreen"]}>
    <ProgressBar
      currentLesson={lessonInStage}
      totalLessons={4}
      title={currentExercise?.lessonHeader || "⚙️ C++ Basics"}
      variant={isExam ? "titleOnly" : "full"}
    />

    <div className={styles["main-layout"]}>
      {/* Left Side */}
      <div className={styles["game-container"]}>
        <div className={styles["game-preview"]}>
          <div
            id="phaser-container"
            className={styles["game-scene"]}
            style={{
              minHeight: "400px",
              position: "relative",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
          </div>
        </div>
      </div>

      {/* Right Side - Code Editor and Terminal */}
      <div className={styles["code-container"]}>
        <div className={styles["code-editor"]}>
          <div className={styles["editor-header"]}>
            <span>main.cpp</span>
            <button 
              className={styles["run-btn"]} 
              onClick={handleRunCode}
              title="Run code"
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
        <StageCompleteModal
          show={showStageComplete}
          stageNumber={displayStageNumber}
          languageLabel="C++"
          badgeSrc={cppStageBadges[displayStageNumber - 1]}
          onContinue={handleStageContinue}
          onClose={() => setShowStageComplete(false)}
        />
      </div>
    </div>
  </div>

  <Footer />
</div>
);
};

export default CppExercise;