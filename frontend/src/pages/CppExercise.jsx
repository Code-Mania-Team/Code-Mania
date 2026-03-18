import React, { useState, useEffect, useMemo } from "react";

import { useParams, useNavigate, useLocation } from "react-router-dom";



import Header from "../components/header";

import SignInModal from "../components/SignInModal";

import ProgressBar from "../components/ProgressBar";

import CourseCompletionPromptModal from "../components/CourseCompletionPromptModal";

import AuthLoadingOverlay from "../components/AuthLoadingOverlay";
import MarkdownRenderer from "../components/MarkdownRenderer";

import CodeTerminal from "../components/CodeTerminal";




import styles from "../styles/CppExercise.module.css";

import { startGame, stopGame } from "../utilities/engine/main.js";



import useAuth from "../hooks/useAxios";

import { axiosPublic } from "../api/axios";

import useGetGameProgress from "../services/getGameProgress.js";

import useGetExerciseById from "../services/getExerciseById";
import useGetExercises from "../services/getExercise";

import useGetNextExercise from "../services/getNextExcercise.js";

import useStartExercise from "../services/startExercise.js";



const CppExercise = ({ onSignOut }) => {

  const location = useLocation();

  const isRetryMode = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return params.get("retry") === "1";
  }, [location.search]);

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

  const { moduleId, exerciseId } = useParams();
  const hasLegacyModuleRoute = Boolean(moduleId);

  // Canonical route uses lesson number (order_index).
  const activeExerciseId = Number(exerciseId);



  const getGameProgress = useGetGameProgress();

  const getExerciseById = useGetExerciseById();
  const getExercises = useGetExercises();

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



  const { isAuthenticated, isLoading: authLoading, setIsAuthenticated, setUser, user } = useAuth();

  // Guest gate: exercises 1-2 are playable; exercise 3+ requires sign-in.
  useEffect(() => {
    if (hasLegacyModuleRoute) return;

     if (authLoading) return;

    if (!isAuthenticated && activeExerciseId > 2) {
      setIsSignInModalOpen(true);
      navigate("/learn/cpp/exercise/2", { replace: true });
      setIsPageLoading(false);
    }
  }, [activeExerciseId, isAuthenticated, navigate, hasLegacyModuleRoute, authLoading]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 900);
      setIsSmallPhone(window.innerWidth <= 380);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isRetryMode) return;
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
  }, [isMobileView, isRetryMode]);


  useEffect(() => {
    const handleStart = async (e) => {
      const engineQuestId = Number(e.detail?.questId);
      if (!Number.isFinite(engineQuestId)) return;

      if (engineQuestId !== activeExerciseId) return;
      if (!activeExercise?.id) return;

      try {
        await startExercise(activeExercise.id);
      } catch (err) {
        console.error("Failed to start quest", err);
      }
    };

    window.addEventListener("code-mania:quest-started", handleStart);

    return () =>
      window.removeEventListener("code-mania:quest-started", handleStart);
  }, [activeExerciseId, activeExercise, startExercise]);

  /* ===============================

     LOAD EXERCISE (BACKEND DRIVEN)

  =============================== */

  useEffect(() => {

    const fetchExercise = async () => {

       setIsPageLoading(true);
       setActiveExercise(null);
       stopGame();

      try {

        // Legacy route: /learn/cpp/exercise/:moduleId/:exerciseId where exerciseId is DB id.
        // Convert it to canonical /learn/cpp/exercise/:orderIndex.
        if (hasLegacyModuleRoute) {
          const legacyDbId = Number(exerciseId);
          if (Number.isFinite(legacyDbId)) {
            const legacyQuest = await getExerciseById(legacyDbId);
            const legacyOrder = Number(legacyQuest?.order_index ?? legacyQuest?.orderIndex);
            if (Number.isFinite(legacyOrder)) {
              navigate(
                `/learn/cpp/exercise/${legacyOrder}${isRetryMode ? "?retry=1" : ""}`,
                { replace: true }
              );
              return;
            }
          }
        }

        // Route param is the lesson number (order_index). Quests in DB may not have
        // ids aligned across languages, so resolve DB quest id via language list.
        const exercises = await getExercises(2);
        const meta = (Array.isArray(exercises) ? exercises : []).find((q) =>
          Number(q?.order_index ?? q?.orderIndex) === activeExerciseId
        );

        if (!meta?.id) {
          navigate("/learn/cpp/exercise/1", { replace: true });
          return;
        }

        const quest = await getExerciseById(meta.id);
        setActiveExercise(quest);

         setTimeout(() => setIsPageLoading(false), 120);

      } catch (err) {

        if (err.response?.status === 401 || err.response?.status === 403) {
          if (!isAuthenticated && activeExerciseId > 2) {
            setIsSignInModalOpen(true);
            navigate("/learn/cpp/exercise/2", { replace: true });
            setIsPageLoading(false);
            return;
          }

          const redirectId = err.response?.data?.redirectTo;
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

        // Ensure we don't get stuck on the loading overlay.
        setIsPageLoading(false);

      }

    };



    fetchExercise();

  }, [activeExerciseId, isAuthenticated, navigate, hasLegacyModuleRoute, exerciseId, isRetryMode]);



  /* ===============================

     LOAD PROGRESS

  =============================== */

  useEffect(() => {
    const loadProgress = async () => {
      if (!isAuthenticated) {
        setDbCompletedQuests([]);
        setCompletedQuizStages([]);
        return;
      }

      const result = await getGameProgress(2);

      if (result?.completedQuests) {
        const completedDbIds = (Array.isArray(result.completedQuests)
          ? result.completedQuests
          : [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id));

        // Engine quests use lesson/order_index ids; backend progress stores DB quest ids.
        const exercises = await getExercises(2);
        const dbIdToOrder = new Map(
          (Array.isArray(exercises) ? exercises : [])
            .map((q) => [Number(q?.id), Number(q?.order_index ?? q?.orderIndex)])
            .filter(([id, order]) => Number.isFinite(id) && Number.isFinite(order))
        );

        const normalized = completedDbIds
          .map((id) => dbIdToOrder.get(id) ?? id)
          .filter((id) => Number.isFinite(id));

        setDbCompletedQuests(normalized);
      }

      setCompletedQuizStages(Array.isArray(result?.completedQuizStages) ? result.completedQuizStages : []);

    };



    loadProgress();
  }, [isAuthenticated]);



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
    setMobileActivePanel(isRetryMode ? "editor" : "game");
  }, [activeExerciseId, isRetryMode]);

  useEffect(() => {
    if (isRetryMode) return;
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
  }, [isMobileView, isRetryMode, mobileActivePanel]);



  /* ===============================

     NEXT EXERCISE LISTENER

  =============================== */

  useEffect(() => {

    const onRequestNext = async (e) => {

      const currentId = Number(e.detail?.exerciseId);
      if (!Number.isFinite(currentId)) return;

      // Guest flow: allow 1 -> 2; block 2 -> 3 and show sign-in.
      if (!isAuthenticated) {
        if (currentId >= 2) {
          setIsSignInModalOpen(true);
          return;
        }
        navigate(`/learn/cpp/exercise/${currentId + 1}`);
        return;
      }

      const currentDbId = Number(activeExercise?.id);
      if (!Number.isFinite(currentDbId)) return;

      const next = await getNextExercise(currentDbId);
      if (!next) {
        setShowCourseCompletePrompt(true);
        return;
      }

      const nextOrder = Number(next?.order_index ?? next?.orderIndex);
      if (!Number.isFinite(nextOrder)) return;

      navigate(`/learn/cpp/exercise/${nextOrder}`);

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

  }, [getNextExercise, isAuthenticated, navigate]);



  /* ===============================

     PHASER INIT (MATCH PYTHON)

  =============================== */

  useEffect(() => {

    if (isRetryMode) {
      stopGame();
      setTerminalEnabled(true);
      return;
    }

    if (!activeExercise) return;

    // Prevent starting Phaser with stale quest while the route param changes.
    // For JS/C++ routes, the URL param is the lesson number (order_index).
    const activeOrder = Number(activeExercise?.order_index ?? activeExercise?.orderIndex);
    if (Number.isFinite(activeOrder) && activeOrder !== activeExerciseId) {
      return;
    }



    const engineQuestId = Number(activeExercise?.order_index ?? activeExerciseId);
    const engineQuest = {
      ...activeExercise,
      // Engine quest ids must match map NPC quest ids (1-16), not DB ids.
      id: Number.isFinite(engineQuestId) ? engineQuestId : activeExerciseId,
      dbId: activeExercise?.id,
    };

    startGame({

      exerciseId: engineQuest.id,

      quest: engineQuest,

      completedQuests: dbCompletedQuests,

      parent: "phaser-container"

    });

    // Fail-safe: if Phaser has been started, remove the loading overlay.
    setIsPageLoading(false);



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

        if (!isAuthenticated) return;

        const currentDbId = Number(activeExercise?.id);
        if (!Number.isFinite(currentDbId)) return;

        getNextExercise(currentDbId).then((next) => {
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

  }, [activeExercise, activeExerciseId, completedQuizStages, dbCompletedQuests, isRetryMode, isAuthenticated]);

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



  return (

    <div className={styles["cpp-exercise-page"]}>

      {isPageLoading && <AuthLoadingOverlay />}

      <Header

        isAuthenticated={isAuthenticated}

        onOpenModal={() => setIsSignInModalOpen(true)}

        user={user}

        onSignOut={onSignOut}

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

        {isMobileView && !isRetryMode && (
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

        {isMobileView && isRetryMode && (
          <div
            className={`${styles["mobile-panel-switcher-top"]} ${isSmallPhone ? styles["mobile-panel-switcher-top-compact"] : ""}`}
          >
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



        <div className={`${styles["main-layout"]} ${isRetryMode ? styles["practice-layout"] : ""}`}>
          {!isRetryMode && (
            <div className={`${styles["game-container"]} ${isMobileView && mobileActivePanel !== "game" ? styles["mobile-panel-hidden"] : ""}`}>
              <div id="phaser-container" className={styles["game-scene"]} />
            </div>
          )}

          {isRetryMode && (
            <div className={styles["practice-info-pane"]}>
              <div className={styles["practice-info"]}>
                <div className={styles["practice-title"]}>
                  {activeExercise?.title || "Quest"}
                </div>
                {activeExercise?.description ? (
                  <MarkdownRenderer className={styles["practice-desc"]}>
                    {activeExercise.description}
                  </MarkdownRenderer>
                ) : null}
                {activeExercise?.task ? (
                  <div className={styles["practice-task"]}>
                    <div className={styles["practice-task-label"]}>Task</div>
                    <MarkdownRenderer className={styles["practice-task-body"]}>
                      {activeExercise.task}
                    </MarkdownRenderer>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <div className={`${styles["terminal-pane"]} ${isRetryMode ? styles["practice-terminal-pane"] : ""} ${!isRetryMode && isMobileView && mobileActivePanel === "game" ? styles["mobile-panel-hidden"] : ""}`}>
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
              practiceMode={isRetryMode}
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
