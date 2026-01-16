import React, { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/JavaScriptCourse.css";
import SignInModal from "../components/SignInModal";

const checkmarkIcon = "https://res.cloudinary.com/daegpuoss/image/upload/v1767930102/checkmark_dcvow0.png";

const JavaScriptCourse = () => {
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onOpenModal = () => {
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStartExercise = (moduleId, exerciseName) => {
    localStorage.setItem('hasTouchedCourse', 'true');
    localStorage.setItem('lastCourseTitle', 'JavaScript');
    localStorage.setItem('lastCourseRoute', '/learn/javascript');
    const exerciseId = exerciseName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/learn/javascript/exercise/${moduleId}-${exerciseId}`);
  };

  const userProgress = {
    name: "Your Name",
    level: 1,
    exercisesCompleted: 0,
    totalExercises: 16,
    xpEarned: 0,
    totalXp: 3600
  };

  const modules = [
    {
      id: 1,
      title: "JavaScript Basics",
      description: "Get started with JavaScript fundamentals and write your first interactive code.",
      exercises: [
        { id: 1, name: "Introduction", status: "available" },
        { id: 2, name: "Console Output", status: "locked" },
        { id: 3, name: "Variables", status: "locked" },
        { id: 4, name: "Data Types", status: "locked" }
      ]
    },
    {
      id: 2,
      title: "Functions & Scope",
      description: "Master functions, parameters, and understand variable scope in JavaScript.",
      exercises: [
        { id: 1, name: "Function Basics", status: "locked" },
        { id: 2, name: "Parameters & Arguments", status: "locked" },
        { id: 3, name: "Return Values", status: "locked" },
        { id: 4, name: "Arrow Functions", status: "locked" }
      ]
    },
    {
      id: 3,
      title: "Arrays & Objects",
      description: "Learn to work with arrays and objects to store and manipulate complex data.",
      exercises: [
        { id: 1, name: "Arrays", status: "locked" },
        { id: 2, name: "Array Methods", status: "locked" },
        { id: 3, name: "Objects", status: "locked" },
        { id: 4, name: "Object Methods", status: "locked" }
      ]
    },
    {
      id: 4,
      title: "DOM Manipulation",
      description: "Interact with web pages by manipulating the Document Object Model.",
      exercises: [
        { id: 1, name: "Selecting Elements", status: "locked" },
        { id: 2, name: "Modifying Content", status: "locked" },
        { id: 3, name: "Event Listeners", status: "locked" },
        { id: 4, name: "Dynamic Styling", status: "locked" }
      ]
    },
    {
      id: 5,
      title: "Examination",
      description: "Test your JavaScript knowledge. You must complete all previous modules to unlock this exam.",
      exercises: [
        { id: 1, name: "JavaScript Exam", status: "locked" }
      ]
    }
  ];

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const getStatusIcon = (status) => {
    if (status === "completed") {
      return <img src={checkmarkIcon} alt="Completed" className="status-icon completed" />;
    }
    if (status === "locked") return <Lock className="status-icon locked" />;
    return <Circle className="status-icon available" />;
  };

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
                  <p className="module-description">{module.description}</p>
                  <div className="exercises-list">
                    {module.exercises.map((exercise) => (
                      <div key={exercise.id} className={`exercise-item ${exercise.status}`}>
                        <div className="exercise-info">
                          {module.id !== 5 && (
                            <span className="exercise-number">Exercise {exercise.id}</span>
                          )}
                          <span className="exercise-name">{exercise.name}</span>
                        </div>

                        <div className="exercise-status">
                          {exercise.status === "available" ? (
                            <button 
                              className="start-btn"
                              onClick={() => handleStartExercise(module.id, exercise.name)}
                            >
                              Start
                            </button>
                          ) : (
                            getStatusIcon(exercise.status)
                          )}
                        </div>
                      </div>
                    ))}
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
              <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=user" alt="Profile" />
            </div>
            <div className="profile-info">
              <h4>{userProgress.name}</h4>
              <p>Level {userProgress.level}</p>
            </div>
            <button className="view-profile-btn" onClick={onOpenModal}>View Profile</button>
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
        </div>
      </div>
      
      <SignInModal 
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSignInSuccess={onCloseModal}
      />
    </div>
  );
};

export default JavaScriptCourse;
