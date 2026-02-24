import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lock, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/PythonCourse.css";
import SignInModal from "../components/SignInModal";
import TutorialPopup from "../components/TutorialPopup";
import useAuth from "../hooks/useAxios";
import useGetGameProgress from "../services/getGameProgress";
import { useParams } from "react-router-dom";
import useGetExercises from "../services/getExercise";
import useGetCourseBadges from "../services/getCourseBadge";


const checkmarkIcon = "https://res.cloudinary.com/daegpuoss/image/upload/v1767930102/checkmark_dcvow0.png";


const PythonCourse = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const getGameProgress = useGetGameProgress();
  const [modules, setModules] = useState([]);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const getExercises = useGetExercises();
  const { badges: courseBadges, loading: badgesLoading } = useGetCourseBadges(1); // 1 = Python

  const [expandedModule, setExpandedModule] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);

  const tutorialSeenKey = user?.user_id
    ? `hasSeenTutorial_${user.user_id}`
    : "hasSeenTutorial";

  // Tutorial will be shown only when clicking Start button
  const { exerciseId } = useParams();
  const numericExerciseId = Number(exerciseId);
  const [data, setData] = useState();

 
  useEffect(() => {
    if (!isAuthenticated) {
      setCompletedExercises(new Set());
      setData(null);
      return;
    }

    const loadProgress = async () => {
      try {
        const result = await getGameProgress(1);

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

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const exercises = await getExercises(1);
        if (cancelled) return;

        const groupedModules = [
          { id: 1, title: "Hello World", description: "Learn how to write your first line of Python by printing messages to the terminal.", exercises: [] },
          { id: 2, title: "Variables & Data Types", description: "Understand how to store and manipulate data using variables in Python.", exercises: [] },
          { id: 3, title: "Control Flow", description: "Master conditional statements and decision-making in your programs.", exercises: [] },
          { id: 4, title: "Loops", description: "Learn how to repeat code efficiently using for and while loops.", exercises: [] },
          { id: 5, title: "Examination", description: "Test your Python knowledge. Complete all previous modules to unlock this exam.", exercises: [] }
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
        console.error("Failed to fetch Python exercises:", error);
        if (!cancelled) setModules([]);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await axiosPublic.get("/v1/exercises/programming-language/1", { withCredentials: true });
        const exercises = response?.data?.data || [];
        if (cancelled) return;

        console.log("Fetched exercises:", exercises);

        const groupedModules = [
          { id: 1, title: "Hello World", description: "Learn how to write your first line of Python by printing messages to the terminal.", exercises: [] },
          { id: 2, title: "Variables & Data Types", description: "Understand how to store and manipulate data using variables in Python.", exercises: [] },
          { id: 3, title: "Control Flow", description: "Master conditional statements and decision-making in your programs.", exercises: [] },
          { id: 4, title: "Loops", description: "Learn how to repeat code efficiently using for and while loops.", exercises: [] },
          { id: 5, title: "Examination", description: "Test your Python knowledge. Complete all previous modules to unlock this exam.", exercises: [] }
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
        console.error("Failed to fetch Python exercises:", error);
        if (!cancelled) setModules([]);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);


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

  const getExerciseStatus = (moduleId, exerciseId, previousExerciseId) => {
    if (completedExercises.has(exerciseId)) return "completed";

    if (moduleId > 1 && !previousExerciseId) {
      const prevModule = modules.find(m => m.id === moduleId - 1);
      const prevModuleCompleted =
        !!prevModule &&
        prevModule.exercises.length > 0 &&
        prevModule.exercises.every(ex => completedExercises.has(ex.id));

      if (!prevModuleCompleted) return "locked";
    }

    // unlock next exercise if previous is completed
    if (!previousExerciseId || completedExercises.has(previousExerciseId)) {
      return "available";
    }

    return "locked";
  };

  const getQuizStatus = (moduleId) => {
    // Check if quiz for this module is already completed
    if (data?.completedQuizStages?.includes(moduleId)) return "completed";

    // Check if all exercises in the module are completed
    const module = modules.find(m => m.id === moduleId);
    if (!module) return "locked";

    const allExercisesCompleted = module.exercises.length > 0 && module.exercises.every(exercise =>
      completedExercises.has(exercise.id)
    );

    return allExercisesCompleted ? "available" : "locked";
  };

  const getExamStatus = () => {
    // Temporarily set to available for testing
    return "available";
  };

  const handleStartExercise = (exerciseId) => {
    const hasSeenTutorial = localStorage.getItem(tutorialSeenKey);
    const route = `/learn/python/exercise/${exerciseId}`;

    if (isAuthenticated && hasSeenTutorial !== "true") {
      setPendingRoute(route);
      setShowTutorial(true);
      return;
    }

    localStorage.setItem("hasTouchedCourse", "true");
    localStorage.setItem("lastCourseTitle", "Python");
    localStorage.setItem("lastCourseRoute", "/learn/python");

    navigate(route);

  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem(tutorialSeenKey, 'true');

    if (pendingRoute) {
      const nextRoute = pendingRoute;
      setPendingRoute(null);
      navigate(nextRoute);
    }
  };

  const handleStartExam = () => {
    navigate(`/exam/python`);
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

  const characterIcon = localStorage.getItem('selectedCharacterIcon') || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=user';



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
          <div className="python-hero-badge">
            <span className="python-badge-text">BEGINNER</span>
            <span className="python-badge-text">COURSE</span>
          </div>
          <h1 className="python-hero-title">Python</h1>
          <p className="python-hero-description">
            Explore a mysterious island while learning Python basics like variables, loops, and control flow.
          </p>
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

                      const status = getExerciseStatus(
                        module.id,
                        exercise.id,
                        previousExercise
                      );

                      return (
                        <div key={exercise.id} className={`exercise-item ${status}`}>
                          <div className="exercise-info">
                            {module.id !== 5 && (
                              <span className="exercise-number">
                                EXERCISE {index + 1}
                              </span>
                            )}
                            <span className="exercise-name">{exercise.title}</span>
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
                              onClick={() => navigate(`/quiz/python/${module.id}`)}
                            >
                              Start
                            </button>
                          ) : (
                            <span className="status-icon-wrap">{getStatusIcon(getQuizStatus(module.id))}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {module.id === 5 && (
                      <div className={`exercise-item ${getExamStatus()}`}>
                        <div className="exercise-info">
                          <span className="exercise-name">Python Exam</span>
                        </div>

                        <div className="exercise-status">
                          {getExamStatus() === 'available' ? (
                            <button
                              className="start-btn"
                              onClick={handleStartExam}
                            >
                              Start
                            </button>
                          ) : (
                            getStatusIcon(getExamStatus())
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
                    className="python-course-badge"
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

      {/* Tutorial Popup */}
      {showTutorial && (
        <TutorialPopup
          open={showTutorial}
          onClose={handleTutorialClose}
        />
      )}
    </div>
  );
};

export default PythonCourse;