import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/CppCourse.css";
import SignInModal from "../components/SignInModal";
import ProfileCard from "../components/ProfileCard";
import TutorialPopup from "../components/TutorialPopup";
import useGetGameProgress from "../services/getGameProgress";
import useAuth from "../hooks/useAxios";
import { axiosPublic } from "../api/axios";

// Import C++ course badges
import cppBadge1 from "../assets/badges/C++/cpp-badges1.png";
import cppBadge2 from "../assets/badges/C++/cpp-badges2.png";
import cppBadge3 from "../assets/badges/C++/cpp-badge3.png";
import cppBadge4 from "../assets/badges/C++/cpp-badge4.png";

const checkmarkIcon =
  "https://res.cloudinary.com/daegpuoss/image/upload/v1767930102/checkmark_dcvow0.png";

const CppCourse = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const getGameProgress = useGetGameProgress();

  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [modules, setModules] = useState([]);
  const [data, setData] = useState();

  const tutorialSeenKey = user?.user_id
    ? `hasSeenTutorial_${user.user_id}`
    : "hasSeenTutorial";

  /* ===============================
     FETCH C++ EXERCISES (UNCHANGED)
  =============================== */
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await axiosPublic.get("/v1/exercises/programming-language/2", { withCredentials: true });
        const exercises = response?.data?.data || [];
        if (cancelled) return;

        if (!exercises) return;

        const groupedModules = [
          {
            id: 1,
            title: "C++ Basics",
            description: "Learn the fundamentals of C++.",
            exercises: [],
          },
          {
            id: 2,
            title: "Variables & Data Types",
            description: "Understand C++ variables and types.",
            exercises: [],
          },
          {
            id: 3,
            title: "Control Flow",
            description: "Master conditionals and logic.",
            exercises: [],
          },
          {
            id: 4,
            title: "Loops",
            description: "Work with repetition structures.",
            exercises: [],
          },
          {
            id: 5,
            title: "Examination",
            description:
              "Test your C++ knowledge. You must complete all previous modules to unlock this exam.",
            exercises: [{ id: 17, title: "C++ Exam" }],
          },
        ];

        exercises.forEach((exercise) => {
          const order = Number(exercise.order_index || 0);
          if (order >= 1 && order <= 4) groupedModules[0].exercises.push(exercise);
          else if (order >= 5 && order <= 8) groupedModules[1].exercises.push(exercise);
          else if (order >= 9 && order <= 12) groupedModules[2].exercises.push(exercise);
          else if (order >= 13 && order <= 16) groupedModules[3].exercises.push(exercise);
        });

        setModules(groupedModules);
      } catch (err) {
        console.error("Failed to fetch C++ exercises", err);
        if (!cancelled) setModules([]);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ===============================
     LOAD C++ PROGRESS (FIXED)
  =============================== */
  useEffect(() => {
    if (!isAuthenticated) {
      setCompletedExercises(new Set());
      setData(null);
      return;
    }
  
    const loadProgress = async () => {
      try {
        const result = await getGameProgress(2);
  
        if (!result) return; // handles 401 returning null
  
        setData(result);
  
        setCompletedExercises(
          new Set(result.completedQuests || [])
          );
  
      } catch (err) {
        console.error("Failed to load game progress", err);
        setCompletedExercises(new Set());
      }
    };
  
    loadProgress();
  }, [isAuthenticated]);

  /* ===============================
     HELPERS
  =============================== */
  const getExerciseStatus = (exerciseId, previousExerciseId) => {
    if (completedExercises.has(exerciseId)) return "completed";

    if (!previousExerciseId || completedExercises.has(previousExerciseId)) {
      return "available";
    }

    return "locked";
  };

  const getQuizStatus = (moduleId) => {
    // Check if all exercises in the module are completed
    const module = modules.find(m => m.id === moduleId);
    if (!module) return "locked";
    
    const allExercisesCompleted = module.exercises.length > 0 && module.exercises.every(exercise => 
      completedExercises.has(exercise.id)
    );
    
    return allExercisesCompleted ? "available" : "locked";
  };

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const handleStartExercise = (moduleId, exerciseId) => {
    const hasSeenTutorial = localStorage.getItem(tutorialSeenKey);
    const route = `/learn/cpp/exercise/${moduleId}/${exerciseId}`;

    if (isAuthenticated && hasSeenTutorial !== "true") {
      setPendingRoute(route);
      setShowTutorial(true);
      return;
    }

    localStorage.setItem("hasTouchedCourse", "true");
    localStorage.setItem("lastCourseTitle", "C++");
    localStorage.setItem("lastCourseRoute", "/learn/cpp");

    navigate(route);
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem(tutorialSeenKey, "true");

    if (pendingRoute) {
      const nextRoute = pendingRoute;
      setPendingRoute(null);
      navigate(nextRoute);
    }
  };

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

    if (status === "locked")
      return <Lock className="status-icon locked" />;

    return <Circle className="status-icon available" />;
  };

  const totalExercises = modules
    .filter((module) => module.id !== 5)
    .reduce((sum, module) => sum + module.exercises.length, 0);

  const userProgress = {
    exercisesCompleted: data?.completedQuests?.length || 0,
    totalExercises,
    xpEarned: data?.xpEarned || 0,
    availableQuiz: data?.availableQuiz || 0,
    totalQuiz: 4,
  };

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="cpp-course-page">
      <section className="cpp-hero">
        <div className="cpp-hero-content">
          <div className="cpp-hero-badge">
            <span className="cpp-badge-text">BEGINNER</span>
            <span className="cpp-badge-text">COURSE</span>
          </div>
          <h1 className="cpp-hero-title">C++</h1>
          <p className="cpp-hero-description">
            Navigate a neon city and master core programming fundamentals with C++.
          </p>
        </div>
      </section>

      <div className="cpp-content">
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
                                  handleStartExercise(
                                    module.id,
                                    exercise.id
                                  )
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

                    {module.id !== 5 && (
                      <div className={`exercise-item ${getQuizStatus(module.id)}`}>
                        <div className="exercise-info">
                          <span className="exercise-number">QUIZ</span>
                          <span className="exercise-name">Take Quiz</span>
                        </div>

                        <div className="exercise-status">
                          {getQuizStatus(module.id) === 'available' ? (
                            <button
                              className="start-btn"
                              onClick={() => navigate(`/quiz/cpp/${module.id}`)}
                            >
                              Start
                            </button>
                          ) : (
                            getStatusIcon(getQuizStatus(module.id))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar">
          <div className="progress-card">
            <h4 className="progress-title">Course Progress</h4>

            <div className="progress-item">
              <div className="progress-label">
                <div className="progress-icon exercises"></div>
                <span>Exercises</span>
              </div>
              <span className="progress-value">
                {userProgress.exercisesCompleted} /
                {userProgress.totalExercises}
              </span>
            </div>

            <div className="progress-item">
              <div className="progress-label">
                <div className="progress-icon xp"></div>
                <span>XP Earned</span>
              </div>
              <span className="progress-value">
                {userProgress.xpEarned}
              </span>
            </div>

            <div className="progress-item">
              <div className="progress-label">
                <div className="progress-icon exercises"></div>
                <span>Total Quiz</span>
              </div>
              <span className="progress-value">
                {userProgress.availableQuiz} / {userProgress.totalQuiz}
              </span>
            </div>
          </div>

          <div className="progress-card">
            <h4 className="progress-title">Course Badges</h4>

            <div className="course-badges-grid">
              <img src={cppBadge1} alt="C++ Stage 1" className="cpp-course-badge" />
              <img src={cppBadge2} alt="C++ Stage 2" className="cpp-course-badge" />
              <img src={cppBadge3} alt="C++ Stage 3" className="cpp-course-badge" />
              <img src={cppBadge4} alt="C++ Stage 4" className="cpp-course-badge" />
            </div>
          </div>
        </div>
      </div>

      <SignInModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {showTutorial && (
        <TutorialPopup
          open={showTutorial}
          onClose={handleTutorialClose}
        />
      )}
    </div>
  );

};

export default CppCourse;
