import React, { useState, useEffect } from "react";

import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";

import { useNavigate } from "react-router-dom";

import "../styles/javascriptCourse.css";

import SignInModal from "../components/SignInModal";

import TutorialPopup from "../components/TutorialPopup";

import useAuth from "../hooks/useAxios";

import useGetGameProgress from "../services/getGameProgress";

import useGetExercises from "../services/getExercise";

import useGetCourseBadges from "../services/getCourseBadge";



const checkmarkIcon =

  "https://res.cloudinary.com/daegpuoss/image/upload/v1767930102/checkmark_dcvow0.png";



const JavaScriptCourse = () => {

  const navigate = useNavigate();

  const { isAuthenticated, user} = useAuth();

  const getGameProgress = useGetGameProgress();
  const [modules, setModules] = useState([]);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [completedQuizStages, setCompletedQuizStages] = useState(new Set());
  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const getExercises = useGetExercises();

  const { badges: courseBadges, loading: badgesLoading } = useGetCourseBadges(3);

  const [data, setData] = useState();



  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const exercises = await getExercises(3);
        if (cancelled) return;

      const groupedModules = [

        { id: 1, title: "JavaScript Basics", description: "Learn the fundamentals of JavaScript.", exercises: [] },

        { id: 2, title: "Functions & Scope", description: "Understand functions and parameters.", exercises: [] },

        { id: 3, title: "Arrays & Objects", description: "Work with arrays and objects.", exercises: [] },

        { id: 4, title: "DOM Manipulation", description: "Interact with the DOM.", exercises: [] },

        { id: 5, title: "Examination", description: "Test your JavaScript knowledge. You must complete all previous modules to unlock this exam.", exercises: [{ id: 17, title: "JavaScript Exam" }] }

              ];



      exercises.forEach((exercise) => {

        if (exercise.id >= 33 && exercise.id <= 36)

          groupedModules[0].exercises.push(exercise);

        else if (exercise.id >= 37 && exercise.id <= 40)

          groupedModules[1].exercises.push(exercise);

        else if (exercise.id >= 41 && exercise.id <= 44)

          groupedModules[2].exercises.push(exercise);

        else if (exercise.id >= 45 && exercise.id <= 48)

          groupedModules[3].exercises.push(exercise);

      });





      setModules(groupedModules);

      } catch (error) {
        console.error("Failed to fetch JavaScript exercises:", error);
        if (!cancelled) setModules([]);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);





  /* ===============================

     LOAD PROGRESS (PYTHON LOGIC)

  =============================== */

  useEffect(() => {
    if (!isAuthenticated) {
      setCompletedExercises(new Set());
      setCompletedQuizStages(new Set());
      setData(null);
      return;
    }

    const loadProgress = async () => {
      try {
        const result = await getGameProgress(3);

        if (!result) return; // handles 401 returning null

        setData(result);
        setCompletedExercises(
          new Set(result.completedQuests || [])
        );
        setCompletedQuizStages(new Set(result.completedQuizStages || []));

      } catch (err) {
        console.error("Failed to load game progress", err);
        setCompletedExercises(new Set());
        setCompletedQuizStages(new Set());
      }
    };

    loadProgress();
  }, [isAuthenticated]);



  /* ===============================

     HELPERS (PYTHON LOGIC)

  =============================== */

  const getExerciseStatus = (exerciseId, previousExerciseId) => {

    if (completedExercises.has(exerciseId)) return "completed";



    if (!previousExerciseId || completedExercises.has(previousExerciseId)) {

      return "available";

    }



    return "locked";

  };

  const getQuizStatus = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return "locked";
    
    const allExercisesCompleted = module.exercises.length > 0 && module.exercises.every(exercise => 
      completedExercises.has(exercise.id)
    );

    if (!allExercisesCompleted) return "locked";
    const completedByCount = Number(data?.availableQuiz || 0) >= Number(moduleId);
    if (completedQuizStages.has(moduleId) || completedByCount) return "completed";
    
    return "available";
  };


  const handleViewProfile = () => {

    if (isAuthenticated) {

      navigate('/profile');

    } else {

      onOpenModal();

    }

  };



  const onOpenModal = () => {

    setIsModalOpen(true);

  };



  const onCloseModal = () => {

    setIsModalOpen(false);

  };



  const userProgress = {

    name: user?.full_name || "Guest",

    level: 1,

    exercisesCompleted: data?.completedQuests?.length || 0,

    totalExercises: 16,

    projectsCompleted: 0,

    totalProjects: 2,

    xpEarned: data?.xpEarned || 0,

    totalXp: 2600

  };



  // 🔥 Only showing modified parts — everything else stays the same



  const handleStartExercise = (exerciseId, moduleId) => {

    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");

    const authed = localStorage.getItem("isAuthenticated") === "true";



    if (authed && !hasSeenTutorial) {

      setShowTutorial(true);

    }



    localStorage.setItem("hasTouchedCourse", "true");

    localStorage.setItem("lastCourseTitle", "JavaScript");

    localStorage.setItem("lastCourseRoute", "/learn/javascript");



    // ✅ Store active JS module

    localStorage.setItem("activeJSModule", moduleId);



    navigate(`/learn/javascript/exercise/${exerciseId}`);

  };





  const toggleModule = (moduleId) => {

    setExpandedModule(expandedModule === moduleId ? null : moduleId);

  };

  const characterIcon = localStorage.getItem('selectedCharacterIcon') || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=user';



  const getStatusIcon = (status) => {

    if (status === "completed") {

      return (

        <img

          src={checkmarkIcon}

          alt="Completed"

          className="status-icon completed"

        />

      );

    }

    if (status === "locked") return <Lock className="status-icon locked" />;

    return <Circle className="status-icon available" />;

  };



  /* ===============================

     COURSE STRUCTURE (UNCHANGED)

  =============================== */

  // const modules = [

  //   {

  //     id: 1,

  //     title: "JavaScript Basics",

  //     description:

  //       "Get started with JavaScript fundamentals and write your first interactive code.",

  //     exercises: [

  //       { id: 1, name: "Introduction" },

  //       { id: 2, name: "Console Output" },

  //       { id: 3, name: "Variables" },

  //       { id: 4, name: "Data Types" },

  //     ],

  //   },

  //   {

  //     id: 2,

  //     title: "Functions & Scope",

  //     description:

  //       "Master functions, parameters, and understand variable scope in JavaScript.",

  //     exercises: [

  //       { id: 5, name: "Function Basics" },

  //       { id: 6, name: "Parameters & Arguments" },

  //       { id: 7, name: "Return Values" },

  //       { id: 8, name: "Arrow Functions" },

  //     ],

  //   },

  //   {

  //     id: 3,

  //     title: "Arrays & Objects",

  //     description:

  //       "Learn to work with arrays and objects to store and manipulate complex data.",

  //     exercises: [

  //       { id: 9, name: "Arrays" },

  //       { id: 10, name: "Array Methods" },

  //       { id: 11, name: "Objects" },

  //       { id: 12, name: "Object Methods" },

  //     ],

  //   },

  //   {

  //     id: 4,

  //     title: "DOM Manipulation",

  //     description:

  //       "Interact with web pages by manipulating the Document Object Model.",

  //     exercises: [

  //       { id: 13, name: "Selecting Elements" },

  //       { id: 14, name: "Modifying Content" },

  //       { id: 15, name: "Event Listeners" },

  //       { id: 16, name: "Dynamic Styling" },

  //     ],

  //   },

  //   {

  //     id: 5,

  //     title: "Examination",

  //     description:

  //       "Test your JavaScript knowledge. You must complete all previous modules to unlock this exam.",

  //     exercises: [{ id: 17, name: "JavaScript Exam" }],

  //   },

  // ];



  return (

    <div className="javascript-course-page">

      {/* Hero Section */}

      <section className="javascript-hero">

        <div className="javascript-hero-content">

          <div className="javascript-hero-badge">

            <span className="javascript-badge-text">BEGINNER</span>

            <span className="javascript-badge-text">COURSE</span>

          </div>

          <h1 className="javascript-hero-title">JavaScript ES6+</h1>

          <p className="javascript-hero-description">

            Create interactive web experiences with JavaScript. Learn DOM manipulation, events, and modern ES6+ features.

          </p>

          <button className="start-learning-btn">Start Learning for Free</button>

        </div>

      </section>



      {/* Main Content */}

      <div className="javascript-content">

        {/* Modules Section */}

        <div className="modules-section">

          {modules.map((module) => (

            <div key={module.id} className="module-card">

              <div

                className="module-header"

                onClick={() => toggleModule(module.id)}

              >

                <div className="module-info">

                  <div className="module-icon">+</div>

                  <h3 className="module-title">{module.title}</h3>

                </div>

                {expandedModule === module.id ? (

                  <ChevronUp className="chevron-icon" />

                ) : (

                  <ChevronDown className="chevron-icon" />

                )}

              </div>



              {expandedModule === module.id && (

                <div className="module-content">

                  <p className="module-description">

                    {module.description}

                  </p>

                  <div className="exercises-list">

                    {module.exercises.map((exercise, index) => {

                      const previousExerciseId =

                        index > 0

                          ? module.exercises[index - 1].id

                          : null;



                      const status = getExerciseStatus(

                        exercise.id,

                        previousExerciseId

                      );



                      return (

                        <div

                          key={exercise.id}

                          className={`exercise-item ${status}`}

                        >

                          <div className="exercise-info">

                            {module.id !== 5 && (

                              <span className="exercise-number">

                                EXERCISE {index + 1}

                              </span>

                            )}

                            <span className="exercise-name">

                              {exercise.title}

                            </span>

                          </div>



                          <div className="exercise-status">

                            {status === "available" ? (

                              <button

                                className="start-btn"

                                onClick={() =>

                                  handleStartExercise(exercise.id, module.id)

                                }

                              >

                                Start

                              </button>

                            ) : (

                              getStatusIcon(status)

                            )}

                          </div>

                        </div>

                      );

                    })}

                  </div>

                </div>

              )}

            </div>

          ))}

        </div>



        {/* Sidebar */}

        <div className="sidebar">

          <div className="profile-card">

            <div className="profile-avatar">

              <img src={characterIcon} alt="Profile" />

            </div>

            <div className="profile-info">

              <h4>{userProgress.name}</h4>

              <p>Level {userProgress.level}</p>

            </div>

            <button className="view-profile-btn" onClick={handleViewProfile}>View Profile</button>

          </div>



          <div className="progress-card">

            <h4 className="progress-title">Course Progress</h4>

            

            <div className="progress-item">

              <div className="progress-label">

                <div className="progress-icon exercises"></div>

                <span>Exercises</span>

              </div>

              <span className="progress-value">

                {userProgress.exercisesCompleted} / {userProgress.totalExercises}

              </span>

            </div>



            <div className="progress-item">

              <div className="progress-label">

                <div className="progress-icon xp"></div>

                <span>XP Earned</span>

              </div>

              <span className="progress-value">

                {userProgress.xpEarned} / {userProgress.totalXp}

              </span>

            </div>

          </div>



          {/* Course Badges Section */}

          <div className="progress-card">

            <h4 className="progress-title">Course Badges</h4>

            <div className="course-badges-grid">

              {badgesLoading && <p>Loading...</p>}

              {!badgesLoading &&
                courseBadges?.map((badge) => (
                  <img
                    key={badge.id}
                    src={badge.badge_key}
                    alt={badge.title}
                    className="cpp-course-badge"
                  />
                ))}
            </div>

          </div>

        </div>

      </div>



      <SignInModal

        isOpen={isModalOpen}

        onClose={onCloseModal}

        onSignInSuccess={onCloseModal}

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



export default JavaScriptCourse;