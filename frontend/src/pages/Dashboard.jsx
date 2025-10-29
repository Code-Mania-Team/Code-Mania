import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import pythonGif from '../assets/python.gif';
import styles from '../styles/Dashboard.module.css';

const Dashboard = () => {
  const [progress] = useState(9);
  const [userStats] = useState({
    name: 'Vadeer',
    level: 1,
    totalXP: 68,
    rank: 1,
    badges: 1,
  });

  const [currentCourse] = useState({
    name: 'Python',
    nextExercise: 'Data Types',
    progress: 9
  });

  const [quest] = useState({
    name: '#30NTestOfCode',
    current: 2,
    total: 30,
    reward: 'Spike',
    timeLeft: '3 HOURS LEFT'
  });

  return (
    <div className={styles.container}>
      {/* Animated Background Circles */}
      <div className={styles.circles}>
        <div className={`${styles.circle} ${styles.circle1}`}></div>
        <div className={`${styles.circle} ${styles.circle2}`}></div>
        <div className={`${styles.circle} ${styles.circle3}`}></div>
      </div>
      <Header />
      {/* Welcome Message */}
      <div className={styles['welcome-section']}>
        <div className={styles['robot-icon']}>🤖</div>
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
                <img 
                  src={pythonGif} 
                  alt="Python Programming" 
                  className={styles['course-gif']}
                />
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

        {/* Right Section - Profile & Quest */}
        <div className={styles['right-section']}>
          {/* Profile Card */}
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