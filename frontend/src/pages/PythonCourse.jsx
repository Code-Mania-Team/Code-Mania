import React, { useState } from "react";
import { ChevronDown, ChevronUp, Lock, CheckCircle, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/PythonCourse.css";
import SignInModal from "../components/SignInModal";
import { useAuth } from "../hooks/useAuth";

const PythonCourse = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
      return localStorage.getItem('isAuthenticated') === 'true';
    });
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

   const onOpenModal = () => {
    if (!isAuthenticated) setIsModalOpen(true);
  };


  const onCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStartExercise = (moduleId, exerciseName) => {
    const exerciseId = exerciseName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/learn/python/exercise/${moduleId}-${exerciseId}`);
  };

  const userProgress = {
    name: "Your Name",
    level: 1,
    exercisesCompleted: 0,
    totalExercises: 16,
    projectsCompleted: 0,
    totalProjects: 2,
    xpEarned: 0,
    totalXp: 1600
  };

  const modules = [
    {
      id: 1,
      title: "Hello World",
      description: "Learn how to write your first line of Python by printing messages to the terminal.",
      exercises: [
        { id: 1, name: "Setting Up", status: "available" },
        { id: 2, name: "Hello World", status: "locked" },
        { id: 3, name: "Pattern", status: "locked" },
        { id: 4, name: "Initials", status: "locked" }
      ]
    },
    {
      id: 2,
      title: "Variables & Data Types",
      description: "Understand how to store and manipulate data using variables in Python.",
      exercises: [
        { id: 1, name: "Variables", status: "locked" },
        { id: 2, name: "Strings", status: "locked" },
        { id: 3, name: "Numbers", status: "locked" },
        { id: 4, name: "Booleans", status: "locked" }
      ]
    },
    {
      id: 3,
      title: "Control Flow",
      description: "Master conditional statements and decision-making in your programs.",
      exercises: [
        { id: 1, name: "If Statements", status: "locked" },
        { id: 2, name: "Else & Elif", status: "locked" },
        { id: 3, name: "Comparison", status: "locked" },
        { id: 4, name: "Logical Operators", status: "locked" }
      ]
    },
    {
      id: 4,
      title: "Loops",
      description: "Learn how to repeat code efficiently using for and while loops.",
      exercises: [
        { id: 1, name: "For Loops", status: "locked" },
        { id: 2, name: "While Loops", status: "locked" },
        { id: 3, name: "Range Function", status: "locked" },
        { id: 4, name: "Nested Loops", status: "locked" }
      ]
    }
  ];

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const getStatusIcon = (status) => {
    if (status === "completed") return <CheckCircle className="status-icon completed" />;
    if (status === "locked") return <Lock className="status-icon locked" />;
    return <Circle className="status-icon available" />;
  };

  return (
    <div className="python-course-page">
      {/* Hero Section */}
      <section className="python-hero">
        <div className="python-hero-content">
          <div className="course-badge">
            <span className="badge-text">BEGINNER</span>
            <span className="badge-text">COURSE</span>
          </div>
          <h1 className="python-hero-title">Python</h1>
          <p className="python-hero-description">
            Master the basics of coding including variables, conditionals, and loops.
          </p>
          <button className="start-learning-btn">Start Learning for Free</button>
        </div>
      </section>

      {/* Main Content */}
      <div className="python-content">
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
                          <span className="exercise-number">Exercise {exercise.id}</span>
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
          <div className="profile-card">
            <div className="profile-avatar">
              <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=user" alt="Profile" />
            </div>
            <div className="profile-info">
              <h4>{userProgress.name}</h4>
              <p>Level {userProgress.level}</p>
            </div>
            <button className="view-profile-btn" onClick={onOpenModal}>View Profile</button>
              <SignInModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSignInSuccess={(token) => login(token)} 
              />
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

export default PythonCourse;
