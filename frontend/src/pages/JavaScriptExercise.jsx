import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../components/header";

import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import StageCompleteModal from "../components/StageCompleteModal";
import XpNotification from "../components/XpNotification";
import CodeTerminal from "../components/CodeTerminal";
import styles from "../styles/JavaScriptExercise.module.css";
import jsStage1Badge from "../assets/badges/JavaScript/js-stage1.png";
import jsStage2Badge from "../assets/badges/JavaScript/js-stage2.png";
import jsStage3Badge from "../assets/badges/JavaScript/js-stage3.png";
import jsStage4Badge from "../assets/badges/JavaScript/js-stage4.png";
import exercises from "../utilities/data/javascriptExercises.json";
import achievements from "../utilities/data/achievements.json";
import { initPhaserGame } from "../utilities/engine/main.js";

const JavaScriptExercise = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentExercise, setCurrentExercise] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showScroll, setShowScroll] = useState(true);
  const [showXpPanel, setShowXpPanel] = useState(false);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [runUnlocked, setRunUnlocked] = useState(false);

  // === Dialogue System ===
  const dialogues = [
    "Remember to check the hints if you get stuck during the course. But for this exercise, you don't have to know what's going on with the code – just copy and paste it.",
  ];
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Load exercise data and reset state when exerciseId changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const forceStageComplete = searchParams.get("stageComplete") === "1";

    localStorage.setItem("hasTouchedCourse", "true");
    localStorage.setItem("lastCourseTitle", "JavaScript");
    localStorage.setItem("lastCourseRoute", "/learn/javascript");

    if (exerciseId) {
      const id = parseInt(exerciseId.split('-')[0], 10);
      const exercise = exercises.find(ex => ex.id === id);
      if (exercise) {
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
        
        setCurrentExercise(exercise);
        setCode(exercise.startingCode || `// ${exercise.title}\n\n${exercise.startingCode || ''}`);
        setOutput("");
        setShowHelp(false);
        setShowXpPanel(false);
        setShowStageComplete(forceStageComplete);
        setRunUnlocked(false);
      }
    }
  }, [exerciseId, location.search]);

  useEffect(() => {
    const onTerminalActive = () => {
      setRunUnlocked(true);
    };

    window.addEventListener("code-mania:terminal-active", onTerminalActive);
    return () => {
      window.removeEventListener("code-mania:terminal-active", onTerminalActive);
    };
  }, []);

  const stageNumber = currentExercise ? Math.floor((currentExercise.id - 1) / 4) + 1 : 1;
  const lessonInStage = currentExercise ? ((currentExercise.id - 1) % 4) + 1 : 1;
  const jsStageBadges = [jsStage1Badge, jsStage2Badge, jsStage3Badge, jsStage4Badge];
  const badgeByKey = {
    "js-stage1": jsStage1Badge,
    "js-stage2": jsStage2Badge,
    "js-stage3": jsStage3Badge,
    "js-stage4": jsStage4Badge,
  };
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

  const debugBadges = (() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("debugBadges") === "1";
  })();

  // Navigation functions
  const goToNextExercise = () => {
    if (!currentExercise) return;
    const nextId = currentExercise.id + 1;
    if (nextId <= exercises.length) {
      // Set mapId based on exercise number
      let mapId;
      if (nextId === 1) {
        mapId = "map1";
      } else if (nextId === 2) {
        mapId = "map2";
      } else if (nextId === 3) {
        mapId = "map3";
      } else {
        mapId = "map2"; // Default to map2 for exercises 4+
      }
      localStorage.setItem("currentMapId", mapId);
      
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

  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [achievementToShow, setAchievementToShow] = useState(null);

  const awardAchievementForExercise = (exerciseIdToAward) => {
    const achievement = achievements.find(
      a => a.language === "JavaScript" && a.exerciseId === exerciseIdToAward
    );

    if (!achievement) return null;

    const earnedRaw = localStorage.getItem("earnedAchievements") || "[]";
    let earned;
    try {
      earned = JSON.parse(earnedRaw);
    } catch {
      earned = [];
    }

    const alreadyEarned = earned.some(e => e?.id === achievement.id);
    if (!alreadyEarned) {
      earned.push({ id: achievement.id, received: new Date().toISOString() });
      localStorage.setItem("earnedAchievements", JSON.stringify(earned));
    }

    return achievement;
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

        const resultText = logs.length > 0
          ? `${logs.join("\n")}\n`
          : "Program ran successfully.\n";
        setOutput(resultText);

        const currentId = currentExercise?.id;
        const achievement = awardAchievementForExercise(currentId);

        if (achievement && lessonInStage !== 4) {
          setAchievementToShow(achievement);
          setShowAchievementModal(true);
        }

        if (lessonInStage === 4) {
          setShowStageComplete(true);
          setShowXpPanel(false);
        } else {
          setShowXpPanel(false);
          setShowStageComplete(false);
        }
      } catch (error) {
        setOutput(
          `Error: ${error.message}\n>>> Program failed`
        );
        setShowXpPanel(false);
        setShowStageComplete(false);
        setShowAchievementModal(false);
      }
    }, 500);
  };

  const handleStageContinue = () => {
    setShowStageComplete(false);
    setShowXpPanel(false);
    goToNextExercise();
  };

  const handleAchievementContinue = () => {
    setShowAchievementModal(false);
    setAchievementToShow(null);
    goToNextExercise();
  };

  const handleAchievementClose = () => {
    setShowAchievementModal(false);
    setAchievementToShow(null);
  };

  const handleDebugSkip = () => {
    const currentId = currentExercise?.id;
    const achievement = awardAchievementForExercise(currentId);

    // Mark exercise as completed
    if (currentId) {
      const completedKey = `javascript_completed_exercises`;
      const completedRaw = localStorage.getItem(completedKey) || "[]";
      let completed;
      try {
        completed = JSON.parse(completedRaw);
      } catch {
        completed = [];
      }
      
      if (!completed.includes(currentId)) {
        completed.push(currentId);
        localStorage.setItem(completedKey, JSON.stringify(completed));
        // Dispatch event to notify course page of completion
        window.dispatchEvent(new CustomEvent('exerciseCompleted', {
          detail: { exerciseId: currentId, course: 'javascript' }
        }));
      }
    }

    if (achievement) {
      setAchievementToShow(achievement);
      setShowAchievementModal(true);
      setShowXpPanel(false);
      setShowStageComplete(false);
      return;
    }

    goToNextExercise();
  };

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');
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
    localStorage.setItem('isAuthenticated', 'true');
    window.dispatchEvent(new Event('authchange'));
    setIsSignInModalOpen(false);
  };

  return (
    <div className={styles["javascript-exercise-page"]}>
      <div className={styles["scroll-background"]}></div>
      <Header isAuthenticated={isAuthenticated} onOpenModal={handleOpenModal} user={user} />
      
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
          title="🌐 JavaScript Basics" 
          variant={isExam ? "titleOnly" : "full"}
        />

        <div className={styles["main-layout"]}>
          {/* Left Side - Game Preview */}
          <div className={styles["game-container"]}>
            <div className={styles["game-preview"]}>
              <div 
                className={styles["game-scene"]}
                id="phaser-container"
                style={{
                  minHeight: "400px",
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden"
                }}
              >
              </div>

            </div>
          </div>

          {/* Right Side - Code Editor and Terminal */}
          <CodeTerminal
            language="javascript"
            code={code}
            onRunCode={handleRunCode}
            runUnlocked={runUnlocked}
          />

          <XpNotification
            show={showXpPanel}
            onClose={() => setShowXpPanel(false)}
            onNext={goToNextExercise}
          />

          <StageCompleteModal
            show={showAchievementModal}
            languageLabel="JavaScript"
            titleText={achievementToShow?.title}
            subtitleText={achievementToShow?.description}
            badgeSrc={achievementToShow ? badgeByKey[achievementToShow.badgeKey] : undefined}
            onContinue={handleAchievementContinue}
            onClose={handleAchievementClose}
          />

          <StageCompleteModal
            show={showStageComplete}
            stageNumber={displayStageNumber}
            languageLabel="JavaScript"
            badgeSrc={jsStageBadges[displayStageNumber - 1]}
            onContinue={handleStageContinue}
            onClose={() => setShowStageComplete(false)}
          />
        </div>
      </div>

    </div>
);
};

export default JavaScriptExercise;
