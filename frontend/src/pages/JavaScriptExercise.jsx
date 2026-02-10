import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/header";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import CodeTerminal from "../components/CodeTerminal";
import TutorialPopup from "../components/TutorialPopup";
import StageCompleteModal from "../components/StageCompleteModal";
import XpNotification from "../components/XpNotification";

import styles from "../styles/JavaScriptExercise.module.css";
import exercises from "../utilities/data/javascriptExercises.json";
import { startGame } from "../utilities/engine/main.js";
import useAuth from "../hooks/useAxios";
import { axiosPublic } from "../api/axios";

const JavaScriptExercise = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const completedQuests = location.state?.completedQuests ?? [];

  /* ===============================
     QUEST STATE (MATCH PYTHON)
  =============================== */
  const [activeExerciseId, setActiveExerciseId] = useState(() => {
    const id = Number(exerciseId);
    return Number.isFinite(id) && id > 0 ? id : 1;
  });

  const activeExercise = useMemo(() => {
    return (
      exercises.find(e => e.id === activeExerciseId) ||
      exercises[0]
    );
  }, [activeExerciseId]);

  const [activeQuestId, setActiveQuestId] = useState(null);
  const [terminalEnabled, setTerminalEnabled] = useState(false);

  /* ===============================
     TERMINAL STATE
  =============================== */
  const [code, setCode] = useState(
    activeExercise?.startingCode ||
      `// Write code below ❤️\n\nconsole.log("Hello, World!")`
  );
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

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
        />
      )}
    </div>
  );
};

export default JavaScriptExercise;
