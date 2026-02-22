import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/javascriptCourse.css";
import SignInModal from "../components/SignInModal";
import ProfileCard from "../components/ProfileCard";
import TutorialPopup from "../components/TutorialPopup";
import useAuth from "../hooks/useAxios";
import useGetGameProgress from "../services/getGameProgress";
import { axiosPublic } from "../api/axios";

// Import JavaScript course badges
import jsStage1Badge from "../assets/badges/JavaScript/js-stage1.png";
import jsStage2Badge from "../assets/badges/JavaScript/js-stage2.png";
import jsStage3Badge from "../assets/badges/JavaScript/js-stage3.png";
import jsStage4Badge from "../assets/badges/JavaScript/js-stage4.png";

const checkmarkIcon = "https://res.cloudinary.com/daegpuoss/image/upload/v1767930102/checkmark_dcvow0.png";

const JavaScriptCourse = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const getGameProgress = useGetGameProgress();
  const [modules, setModules] = useState([]);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [data, setData] = useState();

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await axiosPublic.get("/v1/exercises/programming-language/3", { withCredentials: true });
        const exercises = response?.data?.data || [];
        if (cancelled) return;

        const groupedModules = [
          { id: 1, title: "JavaScript Basics", description: "Learn fundamentals of JavaScript.", exercises: [] },
          { id: 2, title: "Functions & Scope", description: "Understand functions and parameters.", exercises: [] },
          { id: 3, title: "Arrays & Objects", description: "Work with arrays and objects.", exercises: [] },
          { id: 4, title: "DOM Manipulation", description: "Interact with the DOM.", exercises: [] },
          { id: 5, title: "Examination", description: "Test your JavaScript knowledge. You must complete all previous modules to unlock this exam.", exercises: [{ id: 17, title: "JavaScript Exam", status: "locked" }] }
        ];

        exercises.forEach((exercise) => {
          const order = Number(exercise.order_index || 0);
          if (order >= 1 && order <= 4) groupedModules[0].exercises.push(exercise);
          else if (order >= 5 && order <= 8) groupedModules[1].exercises.push(exercise);
          else if (order >= 9 && order <= 12) groupedModules[2].exercises.push(exercise);
          else if (order >= 13 && order <= 16) groupedModules[3].exercises.push(exercise);
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

  useEffect(() => {
    if (!isAuthenticated) {
      setCompletedExercises(new Set());
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

      } catch (err) {
        console.error("Failed to load game progress", err);
        setCompletedExercises(new Set());
      }
    };

    loadProgress();
  }, [isAuthenticated]);

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

  const onOpenModal = () => {
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleViewProfile = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      onOpenModal();
    }
  };

  const totalExercises = modules
    .filter((module) => module.id !== 5)
    .reduce((sum, module) => sum + module.exercises.length, 0);

  const userProgress = {
    name: user?.full_name || "Guest",
    level: 1,
    exercisesCompleted: data?.completedQuests?.length || 0,
    totalExercises,
    projectsCompleted: 0,
    totalProjects: 2,
    xpEarned: data?.xpEarned || 0,
    totalXp: 2600,
    availableQuiz: data?.availableQuiz || 0,
    totalQuiz: 4,
  };

  const handleStartExercise = (exerciseId) => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    const authed = localStorage.getItem("isAuthenticated") === "true";

    if (authed && !hasSeenTutorial) {
      setShowTutorial(true);
    }

    localStorage.setItem("hasTouchedCourse", "true");
    localStorage.setItem("lastCourseTitle", "JavaScript");
    localStorage.setItem("lastCourseRoute", "/learn/javascript");

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
            Uncover quiet town mysteries while learning JavaScript basics like functions and logic.
          </p>
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
                        <div key={exercise.id} className={`exercise-item ${status}`}>
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
                                onClick={() => handleStartExercise(exercise.id)}
                              >
                                Start
                              </button>
                            ) : (
                              <span className="status-icon-wrap">{getStatusIcon(status)}</span>
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
                              onClick={() => navigate(`/quiz/javascript/${module.id}`)}
                            >
                              Start
                            </button>
                          ) : (
                            <span className="status-icon-wrap">{getStatusIcon(getQuizStatus(module.id))}</span>
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

        {/* Sidebar */}
        <div className="sidebar">
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

          {/* Course Badges Section */}
          <div className="progress-card">
            <h4 className="progress-title">Course Badges</h4>
            <div className="course-badges-grid">
              <img src={jsStage1Badge} alt="JavaScript Stage 1" className="javascript-course-badge" />
              <img src={jsStage2Badge} alt="JavaScript Stage 2" className="javascript-course-badge" />
              <img src={jsStage3Badge} alt="JavaScript Stage 3" className="javascript-course-badge" />
              <img src={jsStage4Badge} alt="JavaScript Stage 4" className="javascript-course-badge" />
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
