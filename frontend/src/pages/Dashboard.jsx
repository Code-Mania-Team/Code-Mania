import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/footer';
import Header from '../components/header';
import WelcomeOnboarding from '../components/WelcomeOnboarding';
import pythonGif from '../assets/python.gif';
import styles from '../styles/Dashboard.module.css';
import  useAuth  from '../hooks/useAxios.js';
import { axiosPrivate } from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth(); // read authenticated user
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userStats, setUserStats] = useState({
    name: 'User',
    level: 1,
    totalXP: 0,
    rank: 0,
    badges: 0,
  });

  const [currentCourse, setCurrentCourse] = useState({
    name: 'Python',
    nextExercise: 'Data Types',
    progress: 0
  });

  const [quest, setQuest] = useState({
    name: '#30NTestOfCode',
    current: 0,
    total: 30,
    reward: 'Spike',
    timeLeft: '3 HOURS LEFT'
  });

  // Load user info and onboarding
  useEffect(() => {
  if (!auth) {
    navigate('/'); // redirect if not authenticated
    return;
  }

  // Show onboarding only if first time AND requires username
  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
  const shouldShowOnboarding = auth.user?.requiresUsername && hasSeenOnboarding !== 'true';
  setShowOnboarding(shouldShowOnboarding);

    // Load user stats from auth object
    if (auth.user) {
      setUserStats(prev => ({
        ...prev,
        name: auth.user.username || prev.name,
        level: auth.user.level || prev.level,
        totalXP: auth.user.totalXP || prev.totalXP,
        rank: auth.user.rank || prev.rank,
        badges: auth.user.badges || prev.badges
      }));

      setProgress(auth.user.progress || 0);
      setCurrentCourse(prev => ({
        ...prev,
        name: auth.user.currentCourse?.name || prev.name,
        nextExercise: auth.user.currentCourse?.nextExercise || prev.nextExercise,
        progress: auth.user.currentCourse?.progress || prev.progress
      }));
    }
  }, [auth, navigate]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const handleSignOut = async () => {
    try {
      await axiosPrivate.post('/v1/logout'); // invalidate session
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAuth(null);
      navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      {showOnboarding && <WelcomeOnboarding onComplete={handleOnboardingComplete} />}

      <Header 
        isAuthenticated={!!auth}
        onOpenModal={() => {}}
        onSignOut={handleSignOut}
      />

      {/* Animated Background Circles */}
      <div className={styles.circles}>
        <div className={`${styles.circle} ${styles.circle1}`}></div>
        <div className={`${styles.circle} ${styles.circle2}`}></div>
        <div className={`${styles.circle} ${styles.circle3}`}></div>
      </div>

      {/* Welcome Section */}
      <div className={styles['welcome-section']}>
        <div className={styles['robot-icon']}>
          <img src="/src/assets/COMPUTER.png" alt="Computer" style={{ width: '60px', height: '60px' }} />
        </div>
        <div className={styles['speech-bubble']}>
          Hi @{userStats.name}! We've been waiting for you.
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles['main-content']}>
        {/* Left Section - Course Card */}
        <div className={styles['left-section']}>
          <h2 className={styles['section-title']}>Jump back in</h2>
          <div className={styles['course-card']}>
            <div className={styles['course-header']}>
              <div className={styles['progress-bar']}>
                <div className={styles['progress-fill']} style={{ width: `${progress}%` }}></div>
              </div>
              <span className={styles['progress-text']}>{progress}%</span>
            </div>

            <div className={styles['course-content']}>
              <div className={styles['course-image']}>
                <img src={pythonGif} alt="Python Programming" className={styles['course-gif']} />
              </div>

              <div className={styles['course-info']}>
                <span className={styles['course-label']}>COURSE</span>
                <h1 className={styles['course-name']}>{currentCourse.name}</h1>
                <p className={styles['next-exercise']}>Next exercise: {currentCourse.nextExercise}</p>
              </div>

              <div className={styles['course-actions']}>
                <button className={styles['continue-btn']}>Continue Learning</button>
                <Link to={`/learn/${currentCourse.name.toLowerCase()}`} className={styles['view-course-btn']}>
                  View course
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Profile Card */}
        <div className={styles['right-section']}>
          <div className={styles['profile-card']}>
            <div className={styles['profile-header']}>
              <div className={styles.avatar}>👤</div>
              <div className={styles['profile-info']}>
                <h3 className={styles['user-name']}>{userStats.name}</h3>
                <p className={styles['user-level']}>Level {userStats.level}</p>
              </div>
            </div>

            <div className={styles['stats-grid']}>
              <div className={styles['stat-item']}>
                <div className={styles['stat-value']}>{userStats.totalXP}</div>
                <div className={styles['stat-label']}>TOTAL XP</div>
              </div>
              <div className={styles['stat-item']}>
                <div className={styles['stat-value']}>#{userStats.rank}</div>
                <div className={styles['stat-label']}>RANK</div>
              </div>
              <div className={styles['stat-item']}>
                <div className={styles['stat-value']}>{userStats.badges}</div>
                <div className={styles['stat-label']}>ACHIEVEMENTS</div>
              </div>
            </div>

            <Link to="/profile" className={styles['view-profile-btn']}>View profile</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
