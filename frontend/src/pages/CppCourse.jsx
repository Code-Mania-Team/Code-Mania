import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/CppCourse.css";
import SignInModal from "../components/SignInModal";
import ProfileCard from "../components/ProfileCard";

const checkmarkIcon = "https://res.cloudinary.com/daegpuoss/image/upload/v1767930102/checkmark_dcvow0.png";

const CppCourse = () => {
  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Set course info when component loads
  useEffect(() => {
    localStorage.setItem('lastCourseTitle', 'C++');
    localStorage.setItem('lastCourseRoute', '/learn/cpp');
  }, []);

  const onOpenModal = () => {
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
  };

  const userProgress = {
    exercisesCompleted: 0,
    totalExercises: 16,
    xpEarned: 0,
    totalXp: 3600
  };

  const modules = [
    {
      id: 1,
      title: "Getting Started",
      description: "Set up your C++ environment and write your first program with basic output.",
      exercises: [
        { id: 1, name: "The Program", status: "available" },
        { id: 2, name: "Basic Input", status: "available" },
        { id: 3, name: "Comments", status: "available" },
        { id: 4, name: "Basic Output", status: "available" }
      ]
    },
    {
      id: 2,
      title: "Variables & Data Types",
      description: "Learn about different data types, variables, and how to work with them in C++.",
      exercises: [
        { id: 1, name: "Variables", status: "locked" },
        { id: 2, name: "Data Types", status: "locked" },
        { id: 3, name: "Constants", status: "locked" },
        { id: 4, name: "Type Casting", status: "locked" }
      ]
    },
    {
      id: 3,
      title: "Operators & Expressions",
      description: "Master arithmetic, comparison, and logical operators in C++.",
      exercises: [
        { id: 1, name: "Arithmetic Operators", status: "locked" },
        { id: 2, name: "Comparison Operators", status: "locked" },
        { id: 3, name: "Logical Operators", status: "locked" },
        { id: 4, name: "Assignment Operators", status: "locked" }
      ]
    },
    {
      id: 4,
      title: "Control Flow",
      description: "Learn to control program flow with conditional statements and loops.",
      exercises: [
        { id: 1, name: "If Statements", status: "locked" },
        { id: 2, name: "Switch Case", status: "locked" },
        { id: 3, name: "For Loops", status: "locked" },
        { id: 4, name: "While Loops", status: "locked" }
      ]
    },
    {
    id: 5,
    title: "Examination",
    description: "Test your C++ knowledge. You must complete all previous modules to unlock this exam.",
    exercises: [
      { id: 1, name: "C++ Exam", status: "locked" }
    ]
  }
  ];

  const navigate = useNavigate();

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const handleStartExercise = (moduleId, exerciseId) => {
    localStorage.setItem('hasTouchedCourse', 'true');
    localStorage.setItem('lastCourseTitle', 'C++');
    localStorage.setItem('lastCourseRoute', '/learn/cpp');
    navigate(`/learn/cpp/exercise/${moduleId}/${exerciseId}`);
  };

  const getStatusIcon = (status) => {
    if (status === "completed") {
      return <img src={checkmarkIcon} alt="Completed" className="status-icon completed" />;
    }
    if (status === "locked") return <Lock className="status-icon locked" />;
    return <Circle className="status-icon available" />;
  };

  return (
    <div className="cpp-course-page">
      {/* Hero Section */}
      <section className="cpp-hero">
        <div className="cpp-hero-content">
          <div className="course-badge">
            <span className="badge-text">BEGINNER</span>
            <span className="badge-text">COURSE</span>
          </div>
          <h1 className="cpp-hero-title">C++</h1>
          <p className="cpp-hero-description">
            Build high-performance applications with C++. Learn memory management, pointers, and system-level programming.
          </p>
          <button className="start-learning-btn">Start Learning for Free</button>
        </div>
      </section>

      {/* Main Content */}
      <div className="cpp-content">
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
                              onClick={() => handleStartExercise(module.id, exercise.id)}
                            >
                              Start
                            </button>
                          ) : (
                            <button className="locked-btn" disabled>
                              {getStatusIcon(exercise.status)}
                            </button>
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
          <ProfileCard onSignInRequired={onOpenModal} />

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

export default CppCourse;