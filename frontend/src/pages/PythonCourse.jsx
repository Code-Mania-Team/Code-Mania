import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/PythonCourse.css";
import SignInModal from "../components/SignInModal";
import useAuth from "../hooks/useAxios";
import useGetGameProgress from "../services/getGameProgress";
import { useParams } from "react-router-dom";

const checkmarkIcon = "https://res.cloudinary.com/daegpuoss/image/upload/v1767930102/checkmark_dcvow0.png";


const PythonCourse = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const getGameProgress = useGetGameProgress();
  const [completedExercises, setCompletedExercises] = useState(new Set());

  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Tutorial will be shown only when clicking Start button
  const { exerciseId } = useParams();
  const numericExerciseId = Number(exerciseId);
  const [data, setData] = useState();
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadProgress = async () => {
      try {
        const result = await getGameProgress("Python");

        setData(result);

        if (result?.completedQuests) {
          setCompletedExercises(new Set(result.completedQuests));
        }
      } catch (err) {
        console.error("Failed to load game progress", err);
      }
    };

    loadProgress();
  }, [isAuthenticated]);


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

  const getExerciseStatus = (exerciseId, previousExerciseId) => {
    if (completedExercises.has(exerciseId)) return "completed";

    // unlock next exercise if previous is completed
    if (!previousExerciseId || completedExercises.has(previousExerciseId)) {
      return "available";
    }

    return "locked";
  };

  const handleStartExercise = (exerciseId) => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

    if (isAuthenticated && !hasSeenTutorial) {
      setShowTutorial(true);
    }

    localStorage.setItem("hasTouchedCourse", "true");
    localStorage.setItem("lastCourseTitle", "Python");
    localStorage.setItem("lastCourseRoute", "/learn/python");

    // 🔥 PASS THE REAL EXERCISE ID
    navigate(`/learn/python/exercise/${exerciseId}`, {
      state: {
        completedQuests: Array.from(completedExercises),
      },
    });
  };


  const userProgress = {
    name: localStorage.getItem('username') || 'Your Name',
    level: 1,
    exercisesCompleted: data?.completedQuests?.length || 0,
    totalExercises: 16,
    projectsCompleted: 0,
    totalProjects: 2,
    xpEarned: data?.xpEarned || 0,
    totalXp: 3600
  };

  const characterIcon = localStorage.getItem('selectedCharacterIcon') || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=user';

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
        { id: 5, name: "Variables", status: "locked" },
        { id: 6, name: "Strings", status: "locked" },
        { id: 7, name: "Numbers", status: "locked" },
        { id: 8, name: "Booleans", status: "locked" }
      ]
    },
    {
      id: 3,
      title: "Control Flow",
      description: "Master conditional statements and decision-making in your programs.",
      exercises: [
        { id: 9, name: "If Statements", status: "locked" },
        { id: 10, name: "Else & Elif", status: "locked" },
        { id: 11, name: "Comparison", status: "locked" },
        { id: 12, name: "Logical Operators", status: "locked" }
      ]
    },
    {
      id: 4,
      title: "Loops",
      description: "Learn how to repeat code efficiently using for and while loops.",
      exercises: [
        { id: 13, name: "For Loops", status: "locked" },
        { id: 14, name: "While Loops", status: "locked" },
        { id: 15, name: "Range Function", status: "locked" },
        { id: 16, name: "Nested Loops", status: "locked" }
      ]
    },
    {
      id: 5,
      title: "Examination",
      description: "Test your Python knowledge. Complete all previous modules to unlock this exam.",
      exercises: [
        { id: 17, name: "Python Exam", status: "locked" }
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
                    {module.exercises.map((exercise, index) => {
                      const previousExercise =
                        index > 0 ? module.exercises[index - 1].id : null;

                      const status = getExerciseStatus(exercise.id, previousExercise);

                      return (
                        <div key={exercise.id} className={`exercise-item ${status}`}>
                          <div className="exercise-info">
                            {module.id !== 5 && (
                              <span className="exercise-number">
                                Exercise {exercise.id}
                              </span>
                            )}
                            <span className="exercise-name">{exercise.name}</span>
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
                              <button className="locked-btn" disabled>
                                {getStatusIcon(status)}
                              </button>
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

export default PythonCourse;