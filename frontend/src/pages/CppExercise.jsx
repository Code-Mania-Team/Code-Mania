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
import map1 from "../assets/aseprites/map1.png";
import cppStage1Badge from "../assets/badges/C++/c++-stage1-Recovered.png";
import cppStage2Badge from "../assets/badges/C++/c++-stage2-Recovered.png";
import cppStage3Badge from "../assets/badges/C++/c++-stage3-Recovered.png";
import cppStage4Badge from "../assets/badges/C++/c++-stage4-Recovered.png";
import exercises from "../utilities/data/cppExercises.json";

const CppExercise = () => {
const { exerciseId } = useParams();
const navigate = useNavigate();
const location = useLocation();
const [currentExercise, setCurrentExercise] = useState(null);
const [code, setCode] = useState("");
const [output, setOutput] = useState("");
const [showHelp, setShowHelp] = useState(false);
const [showScroll, setShowScroll] = useState(false);
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

// Run code — In C++ we simulate output by showing expectedOutput
const handleRunCode = () => {
if (!currentExercise) return;
  setOutput("Compiling...\n");

setTimeout(() => {
  setOutput(currentExercise.expectedOutput || "✔ Code compiled!");
  setXpEarned(100); // Assuming 100 XP is earned for each successful submit
  if (lessonInStage === 4) {
    setShowStageComplete(true);
    setShowXpPanel(false);
  } else {
    setShowXpPanel(true);
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
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);

const handleOpenModal = () => setIsSignInModalOpen(true);
const handleCloseModal = () => setIsSignInModalOpen(false);

const handleSignInSuccess = () => {
const mockUser = { name: "Coder", email: "[coder@example.com](mailto:coder@example.com)" };
setUser(mockUser);
setIsAuthenticated(true);
setIsSignInModalOpen(false);
};

return (
<div className={styles["javascript-exercise-page"]}>
<div className={styles["scroll-background"]}></div>
<Header
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
            className={styles["game-scene"]}
            style={{
              backgroundImage: `url(${map1})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              minHeight: "400px",
              position: "relative",
              borderRadius: "8px",
              overflow: "hidden",
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
                  <h2>
                    {currentExercise?.lessonHeader || "⚙️ C++ Exercise"}
                  </h2>
                  <p>
                    {currentExercise?.description ||
                      "Complete the C++ challenge below."}
                  </p>

                  {currentExercise?.lessonExample && (
                    <div className={styles["code-example"]}>
                      <h3>Example:</h3>
                      <pre>{currentExercise.lessonExample}</pre>
                    </div>
                  )}

                  <h3>Your Task:</h3>
                  <p>
                    {currentExercise?.task ||
                      "Complete the C++ code below."}
                  </p>

                  <div className={styles.navigation}>
                    <button
                      onClick={goToPrevExercise}
                      disabled={!currentExercise || currentExercise.id <= 1}
                      className={styles.navButton}
                    >
                      <ChevronLeft size={20} /> Previous
                    </button>

                    <span>
                      Exercise {currentExercise?.id || 1} of{" "}
                      {exercises.length}
                    </span>

                    <button
                      onClick={goToNextExercise}
                      disabled={
                        !currentExercise ||
                        currentExercise.id >= exercises.length
                      }
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

      {/* Right Side - Code & Terminal */}
      <div className={styles["code-container"]}>
        <div className={styles["code-editor"]}>
          <div className={styles["editor-header"]}>
            <span>main.cpp</span>
            <button
              className={`${styles["run-btn"]} ${
                !showScroll ? styles["disabled-btn"] : ""
              }`}
              onClick={handleRunCode}
              disabled={!showScroll}
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
            Output
            <button
              className={`${styles["submit-btn"]} ${
                !showScroll ? styles["disabled-btn"] : ""
              }`}
              onClick={handleRunCode}
              disabled={!showScroll}
            >
              Submit
            </button>
          </div>

          <div className={styles["terminal-body"]}>
            {output && (
              <div className={styles["terminal-output"]}>{output}</div>
            )}
          </div>
        </div>
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

  <Footer />
</div>
);
};

export default CppExercise;
