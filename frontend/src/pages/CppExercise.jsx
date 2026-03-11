import React, { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";



import Header from "../components/header";

import SignInModal from "../components/SignInModal";

import ProgressBar from "../components/ProgressBar";

import CourseCompletionPromptModal from "../components/CourseCompletionPromptModal";

import AuthLoadingOverlay from "../components/AuthLoadingOverlay";

import CodeTerminal from "../components/CodeTerminal";




import styles from "../styles/CppExercise.module.css";

import { startGame, stopGame } from "../utilities/engine/main.js";



import useAuth from "../hooks/useAxios";

import { axiosPublic } from "../api/axios";

import useGetGameProgress from "../services/getGameProgress.js";

import useGetExerciseById from "../services/getExerciseById";

import useGetNextExercise from "../services/getNextExcercise.js";

import useStartExercise from "../services/startExercise.js";



const CppExercise = () => {

  const stageBadgeById = {
    1: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173779/cpp-badges1_uswk6d.png",
    2: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173779/cpp-badges2_gcwuva.png",
    3: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173778/cpp-badge3_fasnfk.png",
    4: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173778/cpp-badge4_tnc0hz.png",
  };

  const stageBadgeTitleById = {
    1: "C++ Initiate",
    2: "Data Handler",
    3: "Logic Builder",
    4: "Flow Controller",
  };

  const navigate = useNavigate();

  const { exerciseId } = useParams();

  const activeExerciseId = Number(exerciseId);



  const getGameProgress = useGetGameProgress();

  const getExerciseById = useGetExerciseById();

  const getNextExercise = useGetNextExercise();

  const startExercise = useStartExercise();



  const [dbCompletedQuests, setDbCompletedQuests] = useState([]);

  const [activeExercise, setActiveExercise] = useState(null);

  const [isPageLoading, setIsPageLoading] = useState(true);



  const [terminalEnabled, setTerminalEnabled] = useState(false);

  const [code, setCode] = useState("");

  const [output, setOutput] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 900 : false
  );
  const [isSmallPhone, setIsSmallPhone] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 380 : false
  );
  const [mobileActivePanel, setMobileActivePanel] = useState("game");



  const [showTutorial, setShowTutorial] = useState(false);

  const [showCourseCompletePrompt, setShowCourseCompletePrompt] = useState(false);
  const [showStageQuizPrompt, setShowStageQuizPrompt] = useState(false);
  const [stageQuizId, setStageQuizId] = useState(null);
  const [completedQuizStages, setCompletedQuizStages] = useState([]);

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);



  const { isAuthenticated, setIsAuthenticated, setUser, user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 900);
      setIsSmallPhone(window.innerWidth <= 380);
    };
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

       setIsPageLoading(true);
       setActiveExercise(null);
       stopGame();

      try {

        const quest = await getExerciseById(activeExerciseId);

        const rawSlug = String(
          quest?.programming_languages?.slug ||
            quest?.programming_languages?.name ||
            ""
        ).toLowerCase();
        const normalizedSlug = rawSlug === "c++" ? "cpp" : rawSlug;

        if (normalizedSlug && normalizedSlug !== "cpp") {
          navigate(`/learn/${normalizedSlug}/exercise/${quest.id}`, { replace: true });
          return;
        }

         setActiveExercise(quest);

         setTimeout(() => setIsPageLoading(false), 120);

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
        const normalized = (Array.isArray(result.completedQuests)
          ? result.completedQuests
          : [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id));

        setDbCompletedQuests(normalized);
      }

      setCompletedQuizStages(Array.isArray(result?.completedQuizStages) ? result.completedQuizStages : []);

    };



    loadProgress();

  }, []);



  /* ===============================

     RESET TERMINAL ON EXERCISE CHANGE

  =============================== */

  useEffect(() => {

    setTerminalEnabled(false);
    setShowStageQuizPrompt(false);
    setStageQuizId(null);



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

    };

  }, [activeExercise, activeExerciseId, completedQuizStages, dbCompletedQuests]);

  useEffect(() => {
    return () => {
      stopGame();
    };
  }, []);

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



  if (!activeExercise) return <AuthLoadingOverlay />;



  return (

    <div className={styles["cpp-exercise-page"]}>

      {isPageLoading && <AuthLoadingOverlay />}

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
          <div
            className={`${styles["mobile-panel-switcher-top"]} ${isSmallPhone ? styles["mobile-panel-switcher-top-compact"] : ""}`}
          >
            <button
              type="button"
              className={`${styles["mobile-switch-btn"]} ${mobileActivePanel === "game" ? styles["mobile-switch-btn-active"] : ""}`}
              onClick={() => setMobileActivePanel("game")}
              aria-label="Game Scene"
              title="Game Scene"
            >
              {isSmallPhone ? "Game" : "Game Scene"}
            </button>
            <button
              type="button"
              className={`${styles["mobile-switch-btn"]} ${mobileActivePanel === "editor" ? styles["mobile-switch-btn-active"] : ""}`}
              onClick={() => setMobileActivePanel("editor")}
              aria-label="Code Editor"
              title="Code Editor"
            >
              {isSmallPhone ? "Code" : "Code Editor"}
            </button>
            <button
              type="button"
              className={`${styles["mobile-switch-btn"]} ${mobileActivePanel === "terminal" ? styles["mobile-switch-btn-active"] : ""}`}
              onClick={() => setMobileActivePanel("terminal")}
              aria-label="Terminal"
              title="Terminal"
            >
              {isSmallPhone ? "Term" : "Terminal"}
            </button>
          </div>
        )}



        <div className={styles["main-layout"]}>
          <div className={`${styles["game-container"]} ${isMobileView && mobileActivePanel !== "game" ? styles["mobile-panel-hidden"] : ""}`}>
            <div id="phaser-container" className={styles["game-scene"]} />
          </div>

          <div className={`${styles["terminal-pane"]} ${isMobileView && mobileActivePanel === "game" ? styles["mobile-panel-hidden"] : ""}`}>
            <CodeTerminal
              questId={activeExerciseId}
              code={code}
              onCodeChange={setCode}
              output={output}
              isRunning={isRunning}
              showRunButton={terminalEnabled}
              disabled={!terminalEnabled}
              showMobilePanelSwitcher={false}
              enableMobileSplit={isMobileView}
              mobileActivePanel={mobileActivePanel === "editor" ? "editor" : "terminal"}
              quest={activeExercise}
            />
          </div>

        </div>

      </div>
      <CourseCompletionPromptModal

        show={showStageQuizPrompt}

        languageLabel="C++"

        title="Congratulations!"

        subtitle={`You earned the Stage ${stageQuizId || ""} badge! Take the quiz now or continue exploring.`}

        badgeImage={stageBadgeById[stageQuizId]}

        badgeAlt={`C++ Stage ${stageQuizId || ""} badge`}

        badgeLabel={stageQuizId ? stageBadgeTitleById[stageQuizId] || `Stage ${stageQuizId} badge` : "Stage badge"}

        primaryLabel="Take Quiz"

        onTakeExam={() => {
          if (!stageQuizId) return;
          navigate(`/quiz/cpp/${stageQuizId}`);
        }}

        secondaryLabel="Continue Learning"

        onSecondary={() => {
          setShowStageQuizPrompt(false);
          window.dispatchEvent(new Event("code-mania:close-quest-hud"));
        }}

        feedbackLabel="Share Feedback"

        onFeedback={() => navigate("/freedomwall")}

        showClose={false}

        onClose={() => setShowStageQuizPrompt(false)}

      />

      <CourseCompletionPromptModal

        show={showCourseCompletePrompt}

        languageLabel="C++"

        badgeImage={stageBadgeById[4]}

        badgeAlt="C++ Stage 4 badge"

        badgeLabel="Stage 4 badge earned"

        onTakeExam={() => navigate("/exam/cpp")}

        showTerminalCta

        terminalCtaLabel="Try Out Our Terminal!"

        onTerminalCta={() => navigate("/terminal")}

        onSecondary={() => navigate("/learn/cpp")}

        onClose={() => setShowCourseCompletePrompt(false)}

      />



    </div>
  );
};

export default CppExercise;
