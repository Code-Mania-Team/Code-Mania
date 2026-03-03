import React, { useState, useEffect, useMemo } from "react";

import { useLocation, useParams, useNavigate } from "react-router-dom";



import Header from "../components/header";

import SignInModal from "../components/SignInModal";

import ProgressBar from "../components/ProgressBar";

import CodeTerminal from "../components/CodeTerminal";

import MobileControls from "../components/MobileControls";


import CourseCompletionPromptModal from "../components/CourseCompletionPromptModal";



import styles from "../styles/PythonExercise.module.css";

import { startGame } from "../utilities/engine/main.js";

import useGetGameProgress from "../services/getGameProgress.js";

import useGetExerciseById from "../services/getExerciseById";

import useGetNextExercise from "../services/getNextExcercise.js";

import useStartExercise from "../services/startExercise";





const PythonExercise = ({ isAuthenticated }) => {

  const stageBadgeById = {
    1: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173773/python-badge1_qn63do.png",
    2: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173773/python-badge2_ydndmi.png",
    3: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173774/python-badge3_kadnka.png",
    4: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173774/python-badge4_qbjkh1.png",
  };

  const location = useLocation();

  const [dbCompletedQuests, setDbCompletedQuests] = useState([]);

  const getGameProgress = useGetGameProgress();

  const getExerciseById = useGetExerciseById();

  const getNextExercise = useGetNextExercise();

  const startExercise = useStartExercise();

  const { exerciseId } = useParams();

  const activeExerciseId = Number(exerciseId);

  const [pythonExercises, setPythonExercises] = useState([]);

  const navigate = useNavigate();












  /* ===============================

     QUEST / LESSON STATE

  =============================== */



  const [showTutorial, setShowTutorial] = useState(false);

  const [showCourseCompletePrompt, setShowCourseCompletePrompt] = useState(false);
  const [showStageQuizPrompt, setShowStageQuizPrompt] = useState(false);
  const [stageQuizId, setStageQuizId] = useState(null);
  const [completedQuizStages, setCompletedQuizStages] = useState([]);



  const [activeExercise, setActiveExercise] = useState(null);


  useEffect(() => {
    const handleStart = async (e) => {
      const questId = e.detail?.questId;
      if (!questId) return;

      try {
        await startExercise(questId);
        console.log("✅ Quest started in backend");
      } catch (err) {
        console.error("Failed to start quest", err);
      }
    };

    window.addEventListener("code-mania:quest-started", handleStart);

    return () =>
      window.removeEventListener("code-mania:quest-started", handleStart);
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      try {

        const data = await getGameProgress(1);

        if (data?.completedQuests) {
          setDbCompletedQuests(data.completedQuests);
        }
        setCompletedQuizStages(Array.isArray(data?.completedQuizStages) ? data.completedQuizStages : []);
      } catch (err) {
        console.error("Failed to load progress", err);
      }
    };

    fetchProgress();
  }, []);

  useEffect(() => {

    const fetchExercise = async () => {

      try {

        const quest = await getExerciseById(activeExerciseId);

        setActiveExercise(quest);



      } catch (err) {



        // 🔒 Locked → redirect

        if (err.response?.status === 403) {

          const redirectId = err.response.data?.redirectTo;

          console.log(err.response)

          if (redirectId) {

            navigate(`/learn/python/exercise/${redirectId}`);

            return;

          }

        }



        // ❌ Not found → redirect safely

        if (err.response?.status === 404) {

          navigate("/learn/python/exercise/1");

          return;

        }



        if (err.response?.status === 400) {

          navigate("/learn/python/exercise/1");

          return;

        }



        console.error(err);

      }

    };



    fetchExercise();

  }, [activeExerciseId]);





  /* ===============================

     TERMINAL STATE

  =============================== */

  const [terminalEnabled, setTerminalEnabled] = useState(false);



  useEffect(() => {

    setTerminalEnabled(false);
    setShowStageQuizPrompt(false);
    setStageQuizId(null);

  }, [activeExerciseId]);







  const [code, setCode] = useState(

    activeExercise?.startingCode ||

    `# Write code below ❤️\n\nprint("Hello, World!")`

  );



  const [output, setOutput] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 900 : false
  );
  const [mobileActivePanel, setMobileActivePanel] = useState("game");

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobileView) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [isMobileView]);

  useEffect(() => {
    setMobileActivePanel("game");
  }, [activeExerciseId]);

  useEffect(() => {
    if (!isMobileView || mobileActivePanel === "game") return;

    window.dispatchEvent(new Event("code-mania:force-close-help"));

    const sceneManager = window.game?.scene;
    if (!sceneManager) return;

    if (sceneManager.isActive?.("HelpScene")) {
      sceneManager.stop("HelpScene");
    }

    if (sceneManager.isPaused?.("GameScene")) {
      sceneManager.resume("GameScene");
    }
  }, [isMobileView, mobileActivePanel]);



  useEffect(() => {

    const onRequestNext = async (e) => {

      const currentId = e.detail?.exerciseId;

      if (!currentId) return;



      const next = await getNextExercise(currentId);



      if (!next) {

        console.log("🎉 Course finished");

        navigate("/learn/python/completed");

        return;

      }



      navigate(`/learn/python/exercise/${next.id}`);

    };



    window.addEventListener("code-mania:request-next-exercise", onRequestNext);



    return () => {

      window.removeEventListener("code-mania:request-next-exercise", onRequestNext);

    };

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

    window.addEventListener("code-mania:terminal-active", onTerminalActive);

    window.addEventListener("code-mania:terminal-inactive", onTerminalInactive);

    return () => {

      window.removeEventListener("code-mania:terminal-active", onTerminalActive);

      window.removeEventListener("code-mania:terminal-inactive", onTerminalInactive);
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

    console.log("Active Exercise:", activeExercise);



    if (!activeExercise) return;



    startGame({

      exerciseId: activeExerciseId,

      quest: activeExercise,

      completedQuests: dbCompletedQuests,

      parent: "phaser-container"

    });



    const onQuestStarted = (e) => {

      const questId = e.detail?.questId;

      if (!questId) return;



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

      if (Number(questId) === activeExerciseId) {

        const orderIndex = Number(activeExercise?.order_index || activeExerciseId);
        const totalExercises = Number(activeExercise?.totalExercises || 16);
        const stageNumber = Math.ceil(orderIndex / 4);
        const isStageBoundary = orderIndex % 4 === 0 && orderIndex < totalExercises;
        const alreadyCompletedStageQuiz = completedQuizStages.includes(stageNumber);

        if (isStageBoundary && !alreadyCompletedStageQuiz) {
          setStageQuizId(stageNumber);
          setShowStageQuizPrompt(true);
        }

        getNextExercise(activeExerciseId).then((next) => {

          if (!next) {

            setShowCourseCompletePrompt(true);

          }

        });

      }

    };



    window.addEventListener("code-mania:quest-started", onQuestStarted);

    window.addEventListener("code-mania:quest-complete", onQuestComplete);



    return () => {

      window.removeEventListener("code-mania:quest-started", onQuestStarted);

      window.removeEventListener("code-mania:quest-complete", onQuestComplete);

      if (window.game) {
        window.game.sound?.stopAll();
        window.game.destroy(true);
        window.game = null;
      }

    };

  }, [activeExercise, activeExerciseId, completedQuizStages, dbCompletedQuests]);





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
          currentLesson={activeExercise?.order_index || 1}
          totalLessons={activeExercise?.totalExercises || 16}
          title={activeExercise?.lesson_header || activeExercise?.title || "Python Exercise"}

        />

        {isMobileView && (
          <div className={styles["mobile-panel-switcher-top"]}>
            <button
              type="button"
              className={`${styles["mobile-switch-btn"]} ${mobileActivePanel === "game" ? styles["mobile-switch-btn-active"] : ""}`}
              onClick={() => setMobileActivePanel("game")}
            >
              Game Scene
            </button>
            <button
              type="button"
              className={`${styles["mobile-switch-btn"]} ${mobileActivePanel === "terminal" ? styles["mobile-switch-btn-active"] : ""}`}
              onClick={() => setMobileActivePanel("terminal")}
            >
              Terminal
            </button>
          </div>
        )}



        <div className={styles["main-layout"]}>

          {/* ===== GAME ===== */}

          <div className={styles["game-container"]}>
            <div className={isMobileView && mobileActivePanel !== "game" ? styles["mobile-panel-hidden"] : ""}>

              <div

                id="phaser-container"

                className={styles["game-scene"]}

              />
            </div>

          </div>



          {/* ===== TERMINAL ===== */}

          <div className={`${styles["terminal-pane"]} ${isMobileView && mobileActivePanel !== "terminal" ? styles["mobile-panel-hidden"] : ""}`}>
            <CodeTerminal
              questId={activeExerciseId}
              code={code}
              onCodeChange={setCode}
              output={output}
              isRunning={isRunning}
              showRunButton={terminalEnabled}
              disabled={!terminalEnabled}
              showMobilePanelSwitcher={false}
              enableMobileSplit={false}
            />
          </div>


        </div>

      </div>



      <CourseCompletionPromptModal

        show={showStageQuizPrompt}

        languageLabel="Python"

        title={`Stage ${stageQuizId || ""} completed!`}

        subtitle={`You finished Stage ${stageQuizId || ""}. Take the quiz now or continue learning?`}

        badgeImage={stageBadgeById[stageQuizId]}

        badgeAlt={`Python Stage ${stageQuizId || ""} badge`}

        badgeLabel={stageQuizId ? `Stage ${stageQuizId} badge` : "Stage badge"}

        primaryLabel="Take Quiz"

        onTakeExam={() => {
          if (!stageQuizId) return;
          navigate(`/quiz/python/${stageQuizId}`);
        }}

        secondaryLabel="Continue Learning"

        onSecondary={async () => {
          setShowStageQuizPrompt(false);
          const next = await getNextExercise(activeExerciseId);
          if (next?.id) {
            navigate(`/learn/python/exercise/${next.id}`);
          }
        }}

        onClose={() => setShowStageQuizPrompt(false)}

      />



      <CourseCompletionPromptModal

        show={showCourseCompletePrompt}

        languageLabel="Python"

        onTakeExam={() => navigate("/exam/python")}

        onSecondary={() => navigate("/learn/python")}

        onClose={() => setShowCourseCompletePrompt(false)}

      />



    </div>

  );

};



export default PythonExercise;
