import React, { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";



import Header from "../components/header";

import SignInModal from "../components/SignInModal";

import ProgressBar from "../components/ProgressBar";

import CodeTerminal from "../components/CodeTerminal";

import TutorialPopup from "../components/TutorialPopup";

import StageCompleteModal from "../components/StageCompleteModal";

import styles from "../styles/JavaScriptExercise.module.css";

import { startGame } from "../utilities/engine/main.js";



import useAuth from "../hooks/useAxios";

import { axiosPublic } from "../api/axios";

import useGetGameProgress from "../services/getGameProgress.js";

import useGetExerciseById from "../services/getExerciseById";

import useGetNextExercise from "../services/getNextExcercise.js";



const JavaScriptExercise = () => {

  const navigate = useNavigate();

  const { exerciseId } = useParams();

  const activeExerciseId = Number(exerciseId);



  const getGameProgress = useGetGameProgress();

  const getExerciseById = useGetExerciseById();

  const getNextExercise = useGetNextExercise();



  const [dbCompletedQuests, setDbCompletedQuests] = useState([]);

  const [activeExercise, setActiveExercise] = useState(null);



  const [terminalEnabled, setTerminalEnabled] = useState(false);

  const [code, setCode] = useState(

    `// Write code below ❤️\n\nconsole.log("Hello, World!")`

  );

  const [output, setOutput] = useState("");

  const [isRunning, setIsRunning] = useState(false);



  const [showTutorial, setShowTutorial] = useState(false);

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const [showStageComplete, setShowStageComplete] = useState(false);



  const { isAuthenticated, setIsAuthenticated, setUser, user } = useAuth();



  /* ===============================

     LOAD EXERCISE (MATCH PYTHON)

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

            navigate(`/learn/javascript/exercise/${redirectId}`);

            return;

          }

        }



        if (err.response?.status === 404 || err.response?.status === 400) {

          navigate("/learn/javascript/exercise/1");

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

      const result = await getGameProgress("JavaScript");

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



      navigate(`/learn/javascript/exercise/${next.id}`);

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

    };



    window.addEventListener("code-mania:quest-started", onQuestStarted);

    window.addEventListener("code-mania:quest-complete", onQuestComplete);



    return () => {

      window.removeEventListener("code-mania:quest-started", onQuestStarted);

      window.removeEventListener("code-mania:quest-complete", onQuestComplete);

    };

  }, [activeExercise, dbCompletedQuests]);



  /* ===============================

     RUN CODE

  =============================== */

  const normalize = (text = "") =>

    text

      .replace(/\r\n/g, "\n")

      .split("\n")

      .map((line) => line.trim())

      .join("\n")

      .trim();



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



      if (expected && actual === expected) {

        window.dispatchEvent(

          new CustomEvent("code-mania:quest-complete", {

            detail: { questId: activeExercise.id }

          })

        );

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



      <StageCompleteModal

        show={showStageComplete}

        languageLabel="JavaScript"

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