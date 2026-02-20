import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/javascriptCourse.css";
import SignInModal from "../components/SignInModal";
import ProfileCard from "../components/ProfileCard";
import TutorialPopup from "../components/TutorialPopup";
import useAuth from "../hooks/useAxios";
import useGetGameProgress from "../services/getGameProgress";
import useGetExercises from "../services/getExercise";

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
  const getExercises = useGetExercises();
  const [modules, setModules] = useState([]);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const exercises = await getExercises(3); // JS

      const groupedModules = [
        { id: 1, title: "JavaScript Basics", description: "Learn fundamentals of JavaScript.", exercises: [] },
        { id: 2, title: "Functions & Scope", description: "Understand functions and parameters.", exercises: [] },
        { id: 3, title: "Arrays & Objects", description: "Work with arrays and objects.", exercises: [] },
        { id: 4, title: "DOM Manipulation", description: "Interact with the DOM.", exercises: [] },
        { id: 5, title: "Examination", description: "Test your JavaScript knowledge. You must complete all previous modules to unlock this exam.", exercises: [{ id: 17, title: "JavaScript Exam", status: "locked" }] }
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
    };

    fetchData();
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
                              <button className="locked-btn" disabled>
                                {getStatusIcon(status)}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {module.id !== 5 && (
                      <div className="exercise-item available">
                        <div className="exercise-info">
                          <span className="exercise-number">QUIZ</span>
                          <span className="exercise-name">Take Quiz</span>
                        </div>

                        <div className="exercise-status">
                          <button
                            className="start-btn"
                            onClick={() => navigate(`/quiz/javascript/${module.id}`)}
                          >
                            Start
                          </button>
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
