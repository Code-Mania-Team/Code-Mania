import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/javascriptCourse.css";
import SignInModal from "../components/SignInModal";
import ProfileCard from "../components/ProfileCard";
import TutorialPopup from "../components/TutorialPopup";
import useAuth from "../hooks/useAxios";
import useGetGameProgress from "../services/getGameProgress";

const checkmarkIcon =
  "https://res.cloudinary.com/daegpuoss/image/upload/v1767930102/checkmark_dcvow0.png";

const JavaScriptCourse = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const getGameProgress = useGetGameProgress();

  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  /* ===============================
     LOAD PROGRESS (PYTHON LOGIC)
  =============================== */
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadProgress = async () => {
      try {
        const result = await getGameProgress("JavaScript");
        if (result?.completedQuests) {
          setCompletedExercises(new Set(result.completedQuests));
        }
      } catch (err) {
        console.error("Failed to load JS progress", err);
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

  const handleStartExercise = (exerciseId) => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    const authed = localStorage.getItem("isAuthenticated") === "true";

    if (authed && !hasSeenTutorial) {
      setShowTutorial(true);
    }

    localStorage.setItem("hasTouchedCourse", "true");
    localStorage.setItem("lastCourseTitle", "JavaScript");
    localStorage.setItem("lastCourseRoute", "/learn/javascript");

    navigate(`/learn/javascript/exercise/${exerciseId}`, {
      state: {
        completedQuests: Array.from(completedExercises),
      },
    });
  };

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
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
    if (status === "locked") return <Lock className="status-icon locked" />;
    return <Circle className="status-icon available" />;
  };

  /* ===============================
     COURSE STRUCTURE (UNCHANGED)
  =============================== */
  const modules = [
    {
      id: 1,
      title: "JavaScript Basics",
      description:
        "Get started with JavaScript fundamentals and write your first interactive code.",
      exercises: [
        { id: 1, name: "Introduction" },
        { id: 2, name: "Console Output" },
        { id: 3, name: "Variables" },
        { id: 4, name: "Data Types" },
      ],
    },
    {
      id: 2,
      title: "Functions & Scope",
      description:
        "Master functions, parameters, and understand variable scope in JavaScript.",
      exercises: [
        { id: 5, name: "Function Basics" },
        { id: 6, name: "Parameters & Arguments" },
        { id: 7, name: "Return Values" },
        { id: 8, name: "Arrow Functions" },
      ],
    },
    {
      id: 3,
      title: "Arrays & Objects",
      description:
        "Learn to work with arrays and objects to store and manipulate complex data.",
      exercises: [
        { id: 9, name: "Arrays" },
        { id: 10, name: "Array Methods" },
        { id: 11, name: "Objects" },
        { id: 12, name: "Object Methods" },
      ],
    },
    {
      id: 4,
      title: "DOM Manipulation",
      description:
        "Interact with web pages by manipulating the Document Object Model.",
      exercises: [
        { id: 13, name: "Selecting Elements" },
        { id: 14, name: "Modifying Content" },
        { id: 15, name: "Event Listeners" },
        { id: 16, name: "Dynamic Styling" },
      ],
    },
    {
      id: 5,
      title: "Examination",
      description:
        "Test your JavaScript knowledge. You must complete all previous modules to unlock this exam.",
      exercises: [{ id: 17, name: "JavaScript Exam" }],
    },
  ];

  return (
    <div className="javascript-course-page">
      {/* Hero Section */}
      <section className="javascript-hero">
        <div className="javascript-hero-content">
          <div className="course-badge">
            <span className="badge-text">BEGINNER</span>
            <span className="badge-text">COURSE</span>
          </div>
          <h1 className="javascript-hero-title">JavaScript</h1>
          <p className="javascript-hero-description">
            Create interactive web experiences with JavaScript. Learn DOM
            manipulation, events, and modern ES6+ features.
          </p>
          <button className="start-learning-btn">
            Start Learning for Free
          </button>
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
                                Exercise {exercise.id}
                              </span>
                            )}
                            <span className="exercise-name">
                              {exercise.name}
                            </span>
                          </div>

                          <div className="exercise-status">
                            {status === "available" ? (
                              <button
                                className="start-btn"
                                onClick={() =>
                                  handleStartExercise(exercise.id)
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
          <ProfileCard onSignInRequired={() => setIsModalOpen(true)} />
        </div>
      </div>

      <SignInModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSignInSuccess={() => setIsModalOpen(false)}
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
