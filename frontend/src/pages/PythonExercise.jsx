import React, { useState, useEffect, useMemo } from "react";
import {  useLocation } from "react-router-dom";

import Header from "../components/header";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import CodeTerminal from "../components/CodeTerminal";
import MobileControls from "../components/MobileControls";
import TutorialPopup from "../components/TutorialPopup";

import styles from "../styles/PythonExercise.module.css";
import { startGame } from "../utilities/engine/main.js";
import pythonExercises from "../utilities/data/pythonExercises.json";
import mobileFrame from "../assets/mobile.png";
import useGetGameProgress from "../services/getGameProgress.js";

const PythonExercise = ({ isAuthenticated }) => {
  const location = useLocation();
  const [dbCompletedQuests, setDbCompletedQuests] = useState([]);
  const getGameProgress = useGetGameProgress();


  /* ===============================
     QUEST / LESSON STATE
  =============================== */
  const [activeExerciseId, setActiveExerciseId] = useState(1);

  const [showTutorial, setShowTutorial] = useState(false);

  const activeExercise = useMemo(() => {
    return (
      pythonExercises.find(e => e.id === activeExerciseId) ||
      pythonExercises[0]
    );
  }, [activeExerciseId]);

  /* ===============================
     TERMINAL STATE
  =============================== */
  const [terminalEnabled, setTerminalEnabled] = useState(false);
  const [activeQuestId, setActiveQuestId] = useState(null);

  const [code, setCode] = useState(
    activeExercise?.startingCode ||
      `# Write code below ❤️\n\nprint("Hello, World!")`
  );

  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
        const result = await getGameProgress("Python");
        console.log("Loaded progress:", result);
        if (result?.completedQuests) {
          setDbCompletedQuests(result.completedQuests);

          const nextExercise = result.completedQuests.length + 1;
          setActiveExerciseId(nextExercise);
        }

      };

      loadProgress();
  }, []);


  /* =====================================================
     🔑 GLOBAL KEYBOARD INTERCEPT (PHASER SAFE)
  ===================================================== */
  useEffect(() => {
    let terminalActive = false;

    const onTerminalActive = () => {
      terminalActive = true;
    };

    const onTerminalInactive = () => {
      terminalActive = false;
    };

    // const blockKeys = (e) => {
    //   if (!terminalActive) return;
    //   e.stopImmediatePropagation();
    // };

    window.addEventListener("code-mania:terminal-active", onTerminalActive);
    window.addEventListener("code-mania:terminal-inactive", onTerminalInactive);

    // window.addEventListener("keydown", blockKeys, true);
    // window.addEventListener("keyup", blockKeys, true);

    return () => {
      window.removeEventListener("code-mania:terminal-active", onTerminalActive);
      window.removeEventListener("code-mania:terminal-inactive", onTerminalInactive);
      // window.removeEventListener("keydown", blockKeys, true);
      // window.removeEventListener("keyup", blockKeys, true);
    };
  }, []);

  /* ===============================
     PHASER INIT + EVENTS
  =============================== */
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    const isAuthenticated =
      localStorage.getItem("isAuthenticated") === "true";

    if (isAuthenticated && !hasSeenTutorial) {
      setShowTutorial(true);
    }

    if (!dbCompletedQuests) return;
    console.log("🎯 Starting game with completed quests:", dbCompletedQuests);

    startGame({
      exerciseId: activeExerciseId,
      completedQuests: dbCompletedQuests,
      parent: "phaser-container"
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
  }, [activeExerciseId, dbCompletedQuests]);


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
     TERMINAL EXECUTION
  =============================== */
  const validateRequirements = (code, requirements) => {
    if (!requirements) return { ok: true };

    if (requirements.mustInclude) {
      for (const keyword of requirements.mustInclude) {
        if (!code.includes(keyword)) {
          return {
            ok: false,
            message: `❌ Your code must include: "${keyword}"`
          };
        }
      }
    }

    return { ok: true };
  };

  const normalize = (text = "") =>
    text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(line => line.trim())
      .join("\n")
      .trim();

  const handleRunCode = async () => {
    if (!terminalEnabled || isRunning) return;

    const validation = validateRequirements(
      code,
      activeExercise.requirements
    );

    if (!validation.ok) {
      setOutput(validation.message);
      return;
    }

    setIsRunning(true);
    setOutput("Running...");

    try {
      const res = await fetch("http://localhost:3000/v1/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: "hotdog"
        },
        body: JSON.stringify({
          language: "python",
          code
        })
      });

      const data = await res.json();

      if (data.error) {
        setOutput(data.error);
        return;
      }

      const rawOutput = data.output ?? "";
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
      }
    } catch {
      setOutput("❌ Error connecting to server");
    } finally {
      setIsRunning(false);
    }
  };

  /* ===============================
     AUTH MODAL
  =============================== */
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const handleSignInSuccess = () => {
    localStorage.setItem("isAuthenticated", "true");
    window.dispatchEvent(new Event("authchange"));
    setIsSignInModalOpen(false);
  };

  return (
    <div className={styles["python-exercise-page"]}>
      <Header
        isAuthenticated={isAuthenticated}
        onOpenModal={() => setIsSignInModalOpen(true)}
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
          currentLesson={activeExercise?.id || 1}
          totalLessons={pythonExercises.length}
          title="🐍 Python Basics"
        />

        <div className={styles["main-layout"]}>
          {/* ===== GAME ===== */}
          <div className={styles["game-container"]}>
            <div className={styles["mobile-frame"]}>
              <img
                src={mobileFrame}
                alt="Mobile Frame"
                className={styles["mobile-frame-image"]}
              />

              <MobileControls />

              <div className={styles["mobile-screen"]}>
                <div
                  id="phaser-container"
                  className={styles["game-scene"]}
                />
              </div>
            </div>
          </div>

          {/* ===== TERMINAL ===== */}
          <CodeTerminal
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
      
      {/* Tutorial Popup */}
      {showTutorial && (
        <TutorialPopup 
          open={showTutorial} 
          onClose={() => {
            setShowTutorial(false);
            localStorage.setItem('hasSeenTutorial', 'true');
          }} 
        />
      )}
    </div>
  );
};

export default PythonExercise;
