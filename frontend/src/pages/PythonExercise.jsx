import React, { useState, useEffect, useMemo } from "react";

import { useLocation, useParams, useNavigate } from "react-router-dom";



import Header from "../components/header";

import SignInModal from "../components/SignInModal";

import ProgressBar from "../components/ProgressBar";

import CodeTerminal from "../components/CodeTerminal";

import MobileControls from "../components/MobileControls";


import CourseCompletionPromptModal from "../components/CourseCompletionPromptModal";

import AuthLoadingOverlay from "../components/AuthLoadingOverlay";
import MarkdownRenderer from "../components/MarkdownRenderer";



import styles from "../styles/PythonExercise.module.css";

import { startGame, stopGame } from "../utilities/engine/main.js";

import useGetGameProgress from "../services/getGameProgress.js";

import useGetExerciseById from "../services/getExerciseById";

import useGetNextExercise from "../services/getNextExcercise.js";

import useStartExercise from "../services/startExercise";
import useSideQuestProgress from "../services/useSideQuestProgress";

import useAuth from "../hooks/useAxios";





const PythonExercise = ({ isAuthenticated, onSignOut }) => {
  const { isLoading: authLoading, user } = useAuth() || { isLoading: false, user: null };
  const isAdminUser = String(user?.role || "").toLowerCase() === "admin";

  const stageBadgeById = {
    1: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173773/python-badge1_qn63do.png",
    2: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173773/python-badge2_ydndmi.png",
    3: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173774/python-badge3_kadnka.png",
    4: "https://res.cloudinary.com/daegpuoss/image/upload/v1771173774/python-badge4_qbjkh1.png",
  };

  const stageBadgeTitleById = {
    1: "Python Awakening",
    2: "Keeper of the Core",
    3: "Architect of Logic",
    4: "Master of Iteration",
  };

  const location = useLocation();

  const isRetryMode = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return params.get("retry") === "1";
  }, [location.search]);

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

  const {
    sideQuests,
    refreshSideQuests,
    acceptRequiredByTags,
    markLocalStatus,
  } = useSideQuestProgress({
    enabled: !isRetryMode && Boolean(activeExercise),
    isAdmin: isAdminUser,
    languageSlug:
      activeExercise?.programming_languages?.slug ||
      activeExercise?.programming_languages?.name ||
      "python",
    programmingLanguageId: activeExercise?.programming_language_id || null,
  });

  const [isPageLoading, setIsPageLoading] = useState(true);

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Guest gate: exercises 1-2 are playable; exercise 3+ requires sign-in.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated && activeExerciseId > 2) {
      setIsSignInModalOpen(true);
      // Keep user on the last guest-allowed exercise.
      navigate("/learn/python/exercise/2", { replace: true });
      setIsPageLoading(false);
    }
  }, [activeExerciseId, isAuthenticated, navigate, authLoading]);


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

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        if (!isAuthenticated) {
          setDbCompletedQuests([]);
          setCompletedQuizStages([]);
          return;
        }

        const data = await getGameProgress(1);

        if (data?.completedQuests) {
          const normalized = (Array.isArray(data.completedQuests)
            ? data.completedQuests
            : [])
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id));

          setDbCompletedQuests(normalized);
        }
        setCompletedQuizStages(Array.isArray(data?.completedQuizStages) ? data.completedQuizStages : []);
      } catch (err) {
        console.error("Failed to load progress", err);
      }
    };

    fetchProgress();
  }, [isAuthenticated]);

  useEffect(() => {

    setIsPageLoading(true);
    setActiveExercise(null);
    stopGame();

    const fetchExercise = async () => {

      try {

        const quest = await getExerciseById(activeExerciseId);

        const rawSlug = String(
          quest?.programming_languages?.slug ||
            quest?.programming_languages?.name ||
            ""
        ).toLowerCase();
        const normalizedSlug = rawSlug === "c++" ? "cpp" : rawSlug;

        if (normalizedSlug && normalizedSlug !== "python") {
          navigate(`/learn/${normalizedSlug}/exercise/${quest.id}`, { replace: true });
          return;
        }

        setActiveExercise(quest);

        // keep overlay until phaser re-inits
        setTimeout(() => setIsPageLoading(false), 120);



      } catch (err) {



        // 🔒 Locked
        if (err.response?.status === 403 || err.response?.status === 401) {
          // Guest trying to access exercise 3+
          if (!isAuthenticated && activeExerciseId > 2) {
            setIsSignInModalOpen(true);
            navigate("/learn/python/exercise/2", { replace: true });
            setIsPageLoading(false);
            return;
          }

          const redirectId = err.response?.data?.redirectTo;
          if (redirectId) {
            navigate(`/learn/python/exercise/${redirectId}`);
            return;
          }

          // Locked route without redirect target: keep current screen quietly.
          setIsPageLoading(false);
          return;
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

  }, [activeExerciseId, isAuthenticated, navigate]);
  /* ===============================

     TERMINAL STATE

  =============================== */

  const [terminalEnabled, setTerminalEnabled] = useState(false);
  const [sideQuestTerminalContext, setSideQuestTerminalContext] = useState({ active: false });



  useEffect(() => {

    setTerminalEnabled(false);
    setSideQuestTerminalContext({ active: false });
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
  const [isSmallPhone, setIsSmallPhone] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 380 : false
  );
  const [mobileActivePanel, setMobileActivePanel] = useState("game");

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



  useEffect(() => {
    if (isRetryMode) {
      stopGame();
      setTerminalEnabled(true);
      return;
    }

    const onRequestNext = async (e) => {
      const currentId = Number(e.detail?.exerciseId);
      if (!Number.isFinite(currentId)) return;

      // Guest flow: allow 1 -> 2; block 2 -> 3 and show sign-in.
      if (!isAuthenticated) {
        if (currentId >= 2) {
          setIsSignInModalOpen(true);
          return;
        }
        navigate(`/learn/python/exercise/${currentId + 1}`);
        return;
      }

      try {
        const currentDbId = Number(activeExercise?.id);
        const next = await getNextExercise(
          Number.isFinite(currentDbId) && currentDbId > 0 ? currentDbId : currentId
        );
        if (!next) {
          navigate("/learn/python/completed");
          return;
        }

        navigate(`/learn/python/exercise/${next.id}`);
      } catch (err) {
        const redirectId = Number(err?.response?.data?.redirectTo);
        if (Number.isFinite(redirectId) && redirectId > 0) {
          navigate(`/learn/python/exercise/${redirectId}`);
          return;
        }
      }
    };



    window.addEventListener("code-mania:request-next-exercise", onRequestNext);



    return () => {

      window.removeEventListener("code-mania:request-next-exercise", onRequestNext);

    };

  }, [activeExercise?.id, getNextExercise, isAuthenticated, isRetryMode, navigate]);







  /* =====================================================

     🔑 GLOBAL KEYBOARD INTERCEPT (PHASER SAFE)

  ===================================================== */

  useEffect(() => {
    const onTerminalActive = () => {
      // Side quest / quest HUD interaction should also unlock terminal usage.
      setTerminalEnabled(true);
    };



    const onTerminalInactive = () => {
      // Keep terminal enabled once user has interacted with a quest flow.
    };

    const onTerminalLock = () => {
      setTerminalEnabled(false);
    };

    const onSideQuestContext = (e) => {
      const detail = e?.detail || { active: false };
      setSideQuestTerminalContext(detail);
    };

    window.addEventListener("code-mania:terminal-active", onTerminalActive);

    window.addEventListener("code-mania:terminal-inactive", onTerminalInactive);
    window.addEventListener("code-mania:terminal-lock", onTerminalLock);
    window.addEventListener("code-mania:side-quest-terminal-context", onSideQuestContext);

    return () => {

      window.removeEventListener("code-mania:terminal-active", onTerminalActive);

      window.removeEventListener("code-mania:terminal-inactive", onTerminalInactive);
      window.removeEventListener("code-mania:terminal-lock", onTerminalLock);
      window.removeEventListener("code-mania:side-quest-terminal-context", onSideQuestContext);
    };

  }, []);

  useEffect(() => {
    if (isRetryMode) return;

    const emitSideQuestUpdate = (list) => {
      window.dispatchEvent(
        new CustomEvent("code-mania:side-quests-updated", {
          detail: { sideQuests: Array.isArray(list) ? list : [] },
        })
      );
    };

    emitSideQuestUpdate(sideQuests);

    const onRefreshRequest = async () => {
      const list = await refreshSideQuests();
      emitSideQuestUpdate(list);
    };

    const onAcceptRequired = async (e) => {
      const tags = Array.isArray(e?.detail?.tags) ? e.detail.tags : [];
      const list = await acceptRequiredByTags(tags);
      emitSideQuestUpdate(list);
    };

    const onSideQuestComplete = async (e) => {
      if (isAdminUser) {
        const sideQuestId = Number(e?.detail?.sideQuestId);
        if (Number.isFinite(sideQuestId) && sideQuestId > 0) {
          const updated = markLocalStatus(sideQuestId, "completed", 0);
          emitSideQuestUpdate(updated);
          return;
        }
      }
      const list = await refreshSideQuests();
      emitSideQuestUpdate(list);
    };

    window.addEventListener("code-mania:side-quests-refresh-request", onRefreshRequest);
    window.addEventListener("code-mania:side-quests-accept-required", onAcceptRequired);
    window.addEventListener("code-mania:side-quest-complete", onSideQuestComplete);

    return () => {
      window.removeEventListener("code-mania:side-quests-refresh-request", onRefreshRequest);
      window.removeEventListener("code-mania:side-quests-accept-required", onAcceptRequired);
      window.removeEventListener("code-mania:side-quest-complete", onSideQuestComplete);
    };
  }, [acceptRequiredByTags, isAdminUser, isRetryMode, markLocalStatus, refreshSideQuests, sideQuests]);



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





    if (!activeExercise) return;

    // Prevent starting Phaser with stale quest while the route param changes.
    // When navigating between exercises, React can render with the previous quest
    // before the new quest fetch completes.
    const activeQuestId = Number(activeExercise?.id);
    if (!Number.isFinite(activeQuestId) || activeQuestId !== activeExerciseId) {
      return;
    }



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

        const currentDbId = Number(activeExercise?.id);
        const nextSourceId = Number.isFinite(currentDbId) && currentDbId > 0
          ? currentDbId
          : activeExerciseId;

        getNextExercise(nextSourceId).then((next) => {

          if (!next) {

            setShowCourseCompletePrompt(true);

          }

        }).catch(() => {
          // Ignore lock responses here; route listeners handle navigation.
        });

      }

    };



    window.addEventListener("code-mania:quest-started", onQuestStarted);

    window.addEventListener("code-mania:quest-complete", onQuestComplete);



    return () => {

      window.removeEventListener("code-mania:quest-started", onQuestStarted);

      window.removeEventListener("code-mania:quest-complete", onQuestComplete);

    };

  }, [activeExercise, activeExerciseId, completedQuizStages, dbCompletedQuests, isRetryMode]);

  useEffect(() => {
    return () => {
      stopGame();
    };
  }, []);





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

  const handleSignInSuccess = () => {

    localStorage.setItem("isAuthenticated", "true");

    window.dispatchEvent(new Event("authchange"));

    setIsSignInModalOpen(false);

  };



  return (

    <div className={styles["python-exercise-page"]}>

      {isPageLoading && <AuthLoadingOverlay />}

      <Header

        isAuthenticated={isAuthenticated}

        onOpenModal={() => setIsSignInModalOpen(true)}

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
          title={activeExercise?.lesson_header || activeExercise?.title || "Python Exercise"}

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
           
           {/* ===== GAME ===== */}

          {!isRetryMode && (
            <div className={`${styles["game-container"]} ${isMobileView && mobileActivePanel !== "game" ? styles["mobile-panel-hidden"] : ""}`}>
              <div
                id="phaser-container"
                className={styles["game-scene"]}
              />
            </div>
          )}



          {/* ===== TERMINAL ===== */}

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
              externallyUnlocked={terminalEnabled}
              sideQuestContext={sideQuestTerminalContext}
            />
          </div>


        </div>

      </div>



      <CourseCompletionPromptModal

        show={showStageQuizPrompt}

        languageLabel="Python"

        title="Congratulations!"

        subtitle={`You earned the Stage ${stageQuizId || ""} badge! Take the quiz now or continue exploring.`}

        badgeImage={stageBadgeById[stageQuizId]}

        badgeAlt={`Python Stage ${stageQuizId || ""} badge`}

        badgeLabel={stageQuizId ? stageBadgeTitleById[stageQuizId] || `Stage ${stageQuizId} badge` : "Stage badge"}

        primaryLabel="Take Quiz"

        onTakeExam={() => {
          if (!stageQuizId) return;
          navigate(`/quiz/python/${stageQuizId}`);
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

        languageLabel="Python"

        badgeImage={stageBadgeById[4]}

        badgeAlt="Python Stage 4 badge"

        badgeLabel="Stage 4 badge earned"

        onTakeExam={() => navigate("/exam/python")}

        showTerminalCta

        terminalCtaLabel="Try Out Our Terminal!"

        onTerminalCta={() => navigate("/terminal")}

        onSecondary={() => navigate("/learn/python")}

        onClose={() => setShowCourseCompletePrompt(false)}

      />



    </div>

  );

};



export default PythonExercise;
