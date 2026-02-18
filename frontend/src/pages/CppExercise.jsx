import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Header from "../components/header";
import SignInModal from "../components/SignInModal";
import ProgressBar from "../components/ProgressBar";
import StageCompleteModal from "../components/StageCompleteModal";
import CodeTerminal from "../components/CodeTerminal";
import TutorialPopup from "../components/Tutorialpopup";

import styles from "../styles/JavaScriptExercise.module.css";
import { startGame } from "../utilities/engine/main.js";

import useAuth from "../hooks/useAxios";
import { axiosPublic } from "../api/axios";
import useGetGameProgress from "../services/getGameProgress.js";
import useGetExerciseById from "../services/getExerciseById";
import useGetNextExercise from "../services/getNextExcercise.js";

const CppExercise = () => {
  const navigate = useNavigate();
  const { exerciseId } = useParams();
  const activeExerciseId = Number(exerciseId);

  const getGameProgress = useGetGameProgress();
  const getExerciseById = useGetExerciseById();
  const getNextExercise = useGetNextExercise();

  const [dbCompletedQuests, setDbCompletedQuests] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);

  const [terminalEnabled, setTerminalEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const { isAuthenticated, setIsAuthenticated, setUser, user } = useAuth();

  /* ===============================
     LOAD EXERCISE (BACKEND DRIVEN)
  =============================== */
  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const quest = await getExerciseById(activeExerciseId);
        setActiveExercise(quest);
      } catch (err) {
        if (err.response?.status === 403) {
          const redirectId = err.response.data?.redirectTo;
          if (redirectId) {
            navigate(`/learn/cpp/exercise/${redirectId}`);
            return;
          }
        }

        if (err.response?.status === 404 || err.response?.status === 400) {
          navigate("/learn/cpp/exercise/1");
          return;
        }

        console.error(err);
      }
    };

    fetchExercise();
  }, [activeExerciseId]);

  /* ===============================
     LOAD PROGRESS
  =============================== */
  useEffect(() => {
    const loadProgress = async () => {
      const result = await getGameProgress("C++");
      if (result?.completedQuests) {
        setDbCompletedQuests(result.completedQuests);
      }
    };

    loadProgress();
  }, []);

  /* ===============================
     RESET TERMINAL ON EXERCISE CHANGE
  =============================== */
  useEffect(() => {
    setTerminalEnabled(false);

    if (activeExercise?.startingCode) {
      setCode(activeExercise.startingCode);
      setOutput("");
    }
  }, [activeExerciseId, activeExercise]);

  /* ===============================
     NEXT EXERCISE LISTENER
  =============================== */
  useEffect(() => {
    const onRequestNext = async (e) => {
      const currentId = e.detail?.exerciseId;
      if (!currentId) return;

      const next = await getNextExercise(currentId);

      if (!next) {
        setShowStageComplete(true);
        return;
      }

      navigate(`/learn/cpp/exercise/${next.id}`);
    };

    window.addEventListener(
      "code-mania:request-next-exercise",
      onRequestNext
    );

    return () => {
      window.removeEventListener(
        "code-mania:request-next-exercise",
        onRequestNext
      );
    };
  }, []);

  /* ===============================
     PHASER INIT (MATCH PYTHON)
  =============================== */
  useEffect(() => {
    if (!activeExercise) return;

    startGame({
      exerciseId: activeExerciseId,
      quest: activeExercise,
      completedQuests: dbCompletedQuests,
      parent: "phaser-container"
    });

    const onQuestStarted = (e) => {
      if (!e.detail?.questId) return;
      setTerminalEnabled(true);
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
  }, [activeExercise, dbCompletedQuests]);

  /* ===============================
     RUN CODE (SIMULATED C++)
  =============================== */
  const handleRunCode = () => {
    if (!terminalEnabled || isRunning) return;

    setIsRunning(true);
    setOutput("Compiling C++...\n");

    setTimeout(() => {
      try {
        // In production this should hit a backend compiler
        const expected = activeExercise.expectedOutput || "";

        setOutput(expected || "Program ran successfully.");

        window.dispatchEvent(
          new CustomEvent("code-mania:quest-complete", {
            detail: { questId: activeExercise.id }
          })
        );
      } catch (err) {
        setOutput(`❌ ${err.message}`);
      } finally {
        setIsRunning(false);
      }
    }, 800);
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

  if (!activeExercise) return null;

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
          totalLessons={activeExercise.totalExercises || 1}
          title="💻 C++ Basics"
        />

        <div className={styles["main-layout"]}>
          <div className={styles["game-container"]}>
            <div id="phaser-container" className={styles["game-scene"]} />
          </div>

          <CodeTerminal
            language="cpp"
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

      <StageCompleteModal
        show={showStageComplete}
        languageLabel="C++"
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

export default CppExercise;