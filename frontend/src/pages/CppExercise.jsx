import React, { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";



import Header from "../components/header";

import SignInModal from "../components/SignInModal";

import ProgressBar from "../components/ProgressBar";

import StageCompleteModal from "../components/StageCompleteModal";

import CourseCompletionPromptModal from "../components/CourseCompletionPromptModal";

import CodeTerminal from "../components/CodeTerminal";




import styles from "../styles/CppExercise.module.css";

import { startGame } from "../utilities/engine/main.js";



import useAuth from "../hooks/useAxios";

import { axiosPublic } from "../api/axios";

import useGetGameProgress from "../services/getGameProgress.js";

import useGetExerciseById from "../services/getExerciseById";

import useGetNextExercise from "../services/getNextExcercise.js";

import useStartExercise from "../services/startExercise.js";



const CppExercise = () => {

  const navigate = useNavigate();

  const { exerciseId } = useParams();

  const activeExerciseId = Number(exerciseId);



  const getGameProgress = useGetGameProgress();

  const getExerciseById = useGetExerciseById();

  const getNextExercise = useGetNextExercise();

  const startExercise = useStartExercise();



  const [dbCompletedQuests, setDbCompletedQuests] = useState([]);

  const [activeExercise, setActiveExercise] = useState(null);



  const [terminalEnabled, setTerminalEnabled] = useState(false);

  const [code, setCode] = useState("");

  const [output, setOutput] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 900 : false
  );
  const [mobileActivePanel, setMobileActivePanel] = useState("game");



  const [showTutorial, setShowTutorial] = useState(false);

  const [showStageComplete, setShowStageComplete] = useState(false);

  const [showCourseCompletePrompt, setShowCourseCompletePrompt] = useState(false);

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);



  const { isAuthenticated, setIsAuthenticated, setUser, user } = useAuth();

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

      const result = await getGameProgress(2);

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



  /* ===============================

     NEXT EXERCISE LISTENER

  =============================== */

  useEffect(() => {

    const onRequestNext = async (e) => {

      const currentId = e.detail?.exerciseId;

      if (!currentId) return;



      const next = await getNextExercise(currentId);



      if (!next) {

        setShowCourseCompletePrompt(true);

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

      if (Number(questId) === activeExerciseId) {
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

  }, [activeExercise, dbCompletedQuests]);

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

    <div className={styles["cpp-exercise-page"]}>

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
          currentLesson={activeExercise?.order_index || 1}
          totalLessons={activeExercise?.totalExercises || 16}
          title={activeExercise?.lesson_header || activeExercise?.title || "C++ Exercise"}

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
          <div className={`${styles["game-container"]} ${isMobileView && mobileActivePanel !== "game" ? styles["mobile-panel-hidden"] : ""}`}>
            <div id="phaser-container" className={styles["game-scene"]} />
          </div>

          <div className={isMobileView && mobileActivePanel !== "terminal" ? styles["mobile-panel-hidden"] : ""}>
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



      <StageCompleteModal

        show={showStageComplete}

        languageLabel="C++"

        onClose={() => setShowStageComplete(false)}

      />



      <CourseCompletionPromptModal

        show={showCourseCompletePrompt}

        languageLabel="C++"

        onTakeExam={() => navigate("/exam/cpp")}

        onClose={() => setShowCourseCompletePrompt(false)}

      />



    </div>
  );
};

export default CppExercise;
