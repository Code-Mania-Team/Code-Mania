import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/javascriptCourse.css";
import SignInModal from "../components/SignInModal";
import ProfileCard from "../components/ProfileCard";
import TutorialPopup from "../components/TutorialPopup";

const checkmarkIcon = "https://res.cloudinary.com/daegpuoss/image/upload/v1767930102/checkmark_dcvow0.png";

const JavaScriptCourse = () => {
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);

  // Tutorial will be shown only when clicking Start button

  // Load completed exercises from localStorage
  useEffect(() => {
    const completedRaw = localStorage.getItem('javascript_completed_exercises') || '[]';
    try {
      const completed = JSON.parse(completedRaw);
      setCompletedExercises(completed);
    } catch {
      setCompletedExercises([]);
    }
  }, []);

  // Listen for exercise completion events
  useEffect(() => {
    const handleExerciseCompleted = (event) => {
      const { exerciseId, course } = event.detail;
      if (course === 'javascript') {
        setCompletedExercises(prev => {
          if (!prev.includes(exerciseId)) {
            const updated = [...prev, exerciseId];
            // Save to localStorage
            localStorage.setItem('javascript_completed_exercises', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    };

    window.addEventListener('exerciseCompleted', handleExerciseCompleted);
    return () => window.removeEventListener('exerciseCompleted', handleExerciseCompleted);
  }, []);

  const onOpenModal = () => {
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStartExercise = (moduleId, exerciseName) => {
    // Check if tutorial should be shown before starting first exercise
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated && !hasSeenTutorial) {
      setShowTutorial(true);
    }
    
    localStorage.setItem('hasTouchedCourse', 'true');
    localStorage.setItem('lastCourseTitle', 'JavaScript');
    localStorage.setItem('lastCourseRoute', '/learn/javascript');
    const exercise = modules[moduleId - 1].exercises.find(e => e.name === exerciseName);
    const globalExerciseId = (moduleId - 1) * 4 + exercise.id;
    navigate(`/learn/javascript/exercise/${globalExerciseId}`);
  };

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

  // Calculate exercise status based on completed exercises
  const getExerciseStatus = (moduleIndex, exercise) => {
    // Calculate global exercise ID: (moduleIndex * 4) + exercise.id
    const exerciseId = (moduleIndex * 4) + exercise.id;
    
    if (completedExercises.includes(exerciseId)) {
      return "completed";
    }
    
    // First exercise is always available
    if (exerciseId === 1) {
      return "available";
    }
    
    // Check if previous exercise is completed
    const previousExerciseId = exerciseId - 1;
    if (completedExercises.includes(previousExerciseId)) {
      return "available";
    }
    
    return "locked";
  };

  // Update user progress based on completed exercises
  const updatedUserProgress = {
    exercisesCompleted: completedExercises.length,
    totalExercises: 16,
    xpEarned: completedExercises.length * 225, // 225 XP per exercise
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
                    {module.exercises.map((exercise, exerciseIndex) => {
                      const status = getExerciseStatus(module.id - 1, exercise);
                      return (
                        <div key={exercise.id} className={`exercise-item ${status}`}>
                          <div className="exercise-info">
                            {module.id !== 5 && (
                              <span className="exercise-number">Exercise {exercise.id}</span>
                            )}
                            <span className="exercise-name">{exercise.name}</span>
                          </div>

                          <div className="exercise-status">
                            {status === "available" ? (
                              <button 
                                className="start-btn"
                                onClick={() => handleStartExercise(module.id, exercise.name)}
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
          <ProfileCard onSignInRequired={onOpenModal} />

          <div className="progress-card">
            <h4 className="progress-title">Course Progress</h4>
            
            <div className="progress-item">
              <div className="progress-label">
                <div className="progress-icon exercises"></div>
                <span>Exercises</span>
              </div>
              <span className="progress-value">
                {updatedUserProgress.exercisesCompleted} / {updatedUserProgress.totalExercises}
              </span>
            </div>

            <div className="progress-item">
              <div className="progress-label">
                <div className="progress-icon xp"></div>
                <span>XP Earned</span>
              </div>
              <span className="progress-value">
                {updatedUserProgress.xpEarned} / {updatedUserProgress.totalXp}
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
      
      {/* Tutorial Popup */}
      {showTutorial && (
        <TutorialPopup 
          open={showTutorial} 
          onClose={() => {
            setShowTutorial(false);
            localStorage.setItem('hasSeenTutorial', 'true');
          }} 
        />
      )}
    </div>
  );
};

export default JavaScriptCourse;