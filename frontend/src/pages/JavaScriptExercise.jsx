import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/header";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import CodeTerminal from "../components/CodeTerminal";
import TutorialPopup from "../components/TutorialPopup";
import StageCompleteModal from "../components/StageCompleteModal";
import XpNotification from "../components/XpNotification";
<<<<<<< HEAD
import CodeTerminal from "../components/CodeTerminal";
import TutorialPopup from "../components/TutorialPopup";
=======

>>>>>>> 56e5cef87a8dc875a9c142da84ca25116549c24a
import styles from "../styles/JavaScriptExercise.module.css";
import exercises from "../utilities/data/javascriptExercises.json";
import { startGame } from "../utilities/engine/main.js";
import useAuth from "../hooks/useAxios";
import { axiosPublic } from "../api/axios";

const JavaScriptExercise = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
<<<<<<< HEAD
  const [currentExercise, setCurrentExercise] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showScroll, setShowScroll] = useState(true);
  const [showXpPanel, setShowXpPanel] = useState(false);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [runUnlocked, setRunUnlocked] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
=======
>>>>>>> 56e5cef87a8dc875a9c142da84ca25116549c24a

  const completedQuests = location.state?.completedQuests ?? [];

  /* ===============================
     QUEST STATE (MATCH PYTHON)
  =============================== */
  const [activeExerciseId, setActiveExerciseId] = useState(() => {
    const id = Number(exerciseId);
    return Number.isFinite(id) && id > 0 ? id : 1;
  });

<<<<<<< HEAD
    localStorage.setItem("hasTouchedCourse", "true");
    localStorage.setItem("lastCourseTitle", "JavaScript");
    localStorage.setItem("lastCourseRoute", "/learn/javascript");

    // Check if tutorial should be shown for new accounts
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated && !hasSeenTutorial) {
      setShowTutorial(true);
    }

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

    // 🚫 Prevent scrolling from the very beginning
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    window.addEventListener("code-mania:terminal-active", onTerminalActive);
    return () => {
      // ✅ IMPORTANT: Restore scrolling when leaving this page
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
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
=======
  const activeExercise = useMemo(() => {
    return (
      exercises.find(e => e.id === activeExerciseId) ||
      exercises[0]
>>>>>>> 56e5cef87a8dc875a9c142da84ca25116549c24a
    );
  }, [activeExerciseId]);

  const [activeQuestId, setActiveQuestId] = useState(null);
  const [terminalEnabled, setTerminalEnabled] = useState(false);

<<<<<<< HEAD
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

        // 🎯 Close quest HUD and allow character movement when program runs successfully
        window.dispatchEvent(new CustomEvent("code-mania:terminal-inactive"));

        const currentId = currentExercise?.id;
        // 🚫 NO MORE REACT BADGE MODAL - USING PHASER BADGE SYSTEM INSTEAD

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

    // 🚫 NO MORE REACT BADGE MODAL - USING PHASER BADGE SYSTEM INSTEAD
    goToNextExercise();
  };
=======
  /* ===============================
     TERMINAL STATE
  =============================== */
  const [code, setCode] = useState(
    activeExercise?.startingCode ||
      `// Write code below ❤️\n\nconsole.log("Hello, World!")`
  );
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
>>>>>>> 56e5cef87a8dc875a9c142da84ca25116549c24a

  /* ===============================
     AUTH / UI
  =============================== */
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [showXpPanel, setShowXpPanel] = useState(false);

  const { isAuthenticated, setIsAuthenticated, setUser, user } = useAuth();

  /* ===============================
     NORMALIZE (SAME AS PYTHON)
  =============================== */
  const normalize = (text = "") =>
    text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(line => line.trim())
      .join("\n")
      .trim();

  /* ===============================
     PHASER INIT + EVENTS
  =============================== */
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    const authed = localStorage.getItem("isAuthenticated") === "true";

    if (authed && !hasSeenTutorial) {
      setShowTutorial(true);
    }

    startGame({
      exerciseId: activeExerciseId,
      parent: "phaser-container",
      completedQuests,
    });

    const onQuestStarted = (e) => {
      const questId = e.detail?.questId;
      if (!questId) return;

      setTerminalEnabled(true);
      setActiveQuestId(questId);
      setActiveExerciseId(questId);
    };

    const onQuestComplete = (e) => {
      const questId = e.detail?.questId;
      if (!questId) return;

      const scene = window.game?.scene?.keys?.GameScene;
      scene?.questManager?.completeQuest(questId);

      if (scene) {
        scene.playerCanMove = true;
        scene.gamePausedByTerminal = false;
      }
    };

    window.addEventListener("code-mania:quest-started", onQuestStarted);
    window.addEventListener("code-mania:quest-complete", onQuestComplete);

    return () => {
      window.removeEventListener("code-mania:quest-started", onQuestStarted);
      window.removeEventListener("code-mania:quest-complete", onQuestComplete);
    };
  }, [activeExerciseId]);

  /* ===============================
     UPDATE CODE ON QUEST CHANGE
  =============================== */
  useEffect(() => {
    if (activeExercise?.startingCode) {
      setCode(activeExercise.startingCode);
      setOutput("");
    }
  }, [activeExerciseId]);

  /* ===============================
     RUN CODE (FIXED)
  =============================== */
  const handleRunCode = () => {
    if (!terminalEnabled || isRunning) return;

    setIsRunning(true);
    setOutput("Running...");

    try {
      const logs = [];
      const originalLog = console.log;

      console.log = (...args) => {
        logs.push(args.join(" "));
        originalLog(...args);
      };

      eval(code);

      console.log = originalLog;

      const rawOutput = logs.join("\n");
      setOutput(rawOutput);

      const expected = normalize(activeExercise.expectedOutput);
      const actual = normalize(rawOutput);

      if (
        expected &&
        actual === expected &&
        activeQuestId === activeExercise.id
      ) {
        window.dispatchEvent(
          new CustomEvent("code-mania:quest-complete", {
            detail: { questId: activeExercise.id }
          })
        );

        setShowXpPanel(true);
      }
    } catch (err) {
      setOutput(`❌ ${err.message}`);
    } finally {
      setIsRunning(false);
      window.dispatchEvent(
        new CustomEvent("code-mania:terminal-inactive")
      );
    }
  };

  /* ===============================
     AUTH
  =============================== */
  const handleSignInSuccess = () => {
    axiosPublic
      .get("/v1/account")
      .then((res) => {
        const profile = res?.data?.data;
        if (profile?.user_id) {
          setUser(profile);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
      });

    window.dispatchEvent(new Event("authchange"));
    setIsSignInModalOpen(false);
  };

  /* ===============================
     NAVIGATION
  =============================== */
  const goToNextExercise = () => {
    const nextId = activeExercise.id + 1;
    if (nextId <= exercises.length) {
      navigate(`/learn/javascript/exercise/${nextId}`);
    } else {
      setShowStageComplete(true);
    }
  };

  return (
    <div className={styles["javascript-exercise-page"]}>
      <Header
        isAuthenticated={isAuthenticated}
        onOpenModal={() => setIsSignInModalOpen(true)}
        user={user}
      />

      {isSignInModalOpen && (
        <SignInModal
          isOpen
          onClose={() => setIsSignInModalOpen(false)}
          onSignInSuccess={handleSignInSuccess}
        />
      )}

      <div className={styles["codex-fullscreen"]}>
        <ProgressBar
          currentLesson={activeExercise.id}
          totalLessons={exercises.length}
          title="🌐 JavaScript Basics"
        />

        <div className={styles["main-layout"]}>
          <div className={styles["game-container"]}>
<<<<<<< HEAD
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
      
      {/* Tutorial Popup */}
      {showTutorial && (
        <TutorialPopup 
          open={showTutorial} 
          onClose={() => {
            setShowTutorial(false);
            localStorage.setItem('hasSeenTutorial', 'true');
          }} 
=======
            <div id="phaser-container" className={styles["game-scene"]} />
          </div>

          <CodeTerminal
            language="javascript"
            code={code}
            onCodeChange={setCode}
            onRun={handleRunCode}
            output={output}
            isRunning={isRunning}
            showRunButton={terminalEnabled}
            disabled={!terminalEnabled}
          />
        </div>
      </div>

      <XpNotification
        show={showXpPanel}
        onClose={() => setShowXpPanel(false)}
        onNext={goToNextExercise}
      />

      <StageCompleteModal
        show={showStageComplete}
        languageLabel="JavaScript"
        onContinue={goToNextExercise}
        onClose={() => setShowStageComplete(false)}
      />

      {showTutorial && (
        <TutorialPopup
          open={showTutorial}
          onClose={() => {
            setShowTutorial(false);
            localStorage.setItem("hasSeenTutorial", "true");
          }}
>>>>>>> 56e5cef87a8dc875a9c142da84ca25116549c24a
        />
      )}
    </div>
  );
};

export default JavaScriptExercise;
