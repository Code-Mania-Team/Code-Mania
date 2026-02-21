import React, { useState, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import Footer from '../components/footer';

import Header from '../components/header';

import styles from '../styles/Dashboard.module.css';

import useAuth from "../hooks/useAxios";



// Character icons from Cloudinary

const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';

const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';

const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';

const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';



const Dashboard = ({ onSignOut }) => {

  const navigate = useNavigate();

  const [progress] = useState(0);

  const [characterIcon, setCharacterIcon] = useState(null);

  const { isAuthenticated } = useAuth();



  const [hasTouchedCourse] = useState(() => {

    return localStorage.getItem('hasTouchedCourse') === 'true';

  });

  const [userStats, setUserStats] = useState({

    name: 'User',

    level: 0,

    totalXP: 0,

    rank: 0,

    badges: 0,

  });



  const [currentCourse] = useState(() => {

    const lastCourseTitle = localStorage.getItem('lastCourseTitle');

    const exerciseTitles = {

      'Python': 'Setting Up',

      'C++': 'The Program',

      'JavaScript': 'Introduction'

    };

    return {

      name: lastCourseTitle,

      nextExercise: exerciseTitles[lastCourseTitle] || 'Start Learning',

      progress: 0

    };

  });



  const lastCourseRoute = localStorage.getItem('lastCourseRoute');

  const courseRoute = lastCourseRoute || `/learn`;

  const courseGifs = {

    Python: 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925755/python_mcc7yl.gif',

    'C++': 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/c_atz4sx.gif',

    JavaScript: 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925754/javascript_esc21m.gif',

  };

  const courseGif = courseGifs[currentCourse.name] || courseGifs.Python;

  const courseAccentColor =

    currentCourse.name === 'C++'

      ? '#5B8FB9'

      : currentCourse.name === 'JavaScript'

        ? '#FFD700'

        : '#3CB371';



  useEffect(() => {

    const iconByCharacterId = {

      0: characterIcon1,

      1: characterIcon0,

      2: characterIcon2,

      3: characterIcon3,

    };



    const loadCharacterIcon = () => {

      const storedCharacterIdRaw = localStorage.getItem('selectedCharacter');

      const storedCharacterId = storedCharacterIdRaw === null ? null : Number(storedCharacterIdRaw);

      if (storedCharacterId === null || Number.isNaN(storedCharacterId)) {

        const storedIcon = localStorage.getItem('selectedCharacterIcon');

        setCharacterIcon(storedIcon || null);

        return;

      }



      const expectedIcon = iconByCharacterId[storedCharacterId] || null;

      if (expectedIcon) {

        localStorage.setItem('selectedCharacterIcon', expectedIcon);

      } else {

        localStorage.removeItem('selectedCharacterIcon');

      }

      setCharacterIcon(expectedIcon);

    };



    loadCharacterIcon();



    const handleStorageChange = (e) => {

      if (e.key === 'selectedCharacterIcon' || e.key === 'selectedCharacter') {

        loadCharacterIcon();

      }

    };



    const handleCharacterUpdate = () => {

      loadCharacterIcon();

    };



    window.addEventListener('storage', handleStorageChange);

    window.addEventListener('characterUpdated', handleCharacterUpdate);



    // Load username from localStorage

    const savedUsername = localStorage.getItem('username');

    if (savedUsername) {

      setUserStats(prev => ({

        ...prev,

        name: savedUsername

      }));

    }



    return () => {

      window.removeEventListener('storage', handleStorageChange);

      window.removeEventListener('characterUpdated', handleCharacterUpdate);

    };

  }, []);





  const handleSignOut = () => {

    if (onSignOut) {

      onSignOut();

      return;

    }

    localStorage.removeItem('username');

    localStorage.removeItem('selectedCharacter');

    localStorage.removeItem('selectedCharacterIcon');

    navigate('/');

  };



  return (

    <div className={styles.container}>

      <Header 

        isAuthenticated={isAuthenticated}

        onOpenModal={() => {}}

        onSignOut={handleSignOut}

      />

      {/* Animated Background Circles */}

      {styles.circles && (

        <div className={styles.circles}>

          <div className={`${styles.circle} ${styles.circle1}`}></div>

          <div className={`${styles.circle} ${styles.circle2}`}></div>

          <div className={`${styles.circle} ${styles.circle3}`}></div>

        </div>

      )}

 

      <section className={styles.welcomeHero}>

        <div className={styles.welcomeHeroInner}>

          <div className={styles['welcome-section']}>

            <div className={styles.welcomeBannerInner}>

              <div className={styles.welcomeComputer}>

                <img

                  src="https://res.cloudinary.com/daegpuoss/image/upload/v1767930117/COMPUTER_cejwzd.png"

                  alt="Computer"

                  className={styles.welcomeComputerImg}

                />

              </div>



              <div className={styles.welcomeBannerText}>

                <div className={styles.welcomeBannerTitle}>Everything is under CTRL</div>

                <div className={styles.welcomeBannerSubtitle}>

                  Hi @{userStats.name}! We've been waiting for you.

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>



      <div className={styles['main-content']}>

        <div className={styles['left-section']}>

          {!hasTouchedCourse ? (

            <div className={styles.welcomeFirstCardInline}>

              <div className={styles.welcomeFirstSprite}>

                <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1767930117/COMPUTER_cejwzd.png" alt="Computer" className={styles.welcomeFirstSpriteImg} />

              </div>

              <h1 className={styles.welcomeFirstTitle}>Welcome to Code Mania!</h1>

              <p className={styles.welcomeFirstSubtitle}>

                Your coding journey awaits!, Choose a language to start learning.

              </p>

              <button

                type="button"

                className={styles.getStartedBtn}

                onClick={() => navigate('/learn')}

              >

                Get Started

              </button>

            </div>

          ) : (

            <>

              <h2 className={styles['section-title']}>Jump back in</h2>

              

              <div className={styles['course-card']} style={{ '--course-accent': courseAccentColor }}>

                <div className={styles['course-header']}>

                  <div className={styles['progress-bar']}>

                    <div className={styles['progress-fill']} style={{ width: `${progress}%` }}></div>

                  </div>

                  <span className={styles['progress-text']}>{progress}%</span>

                </div>



                <div className={styles['course-content']}>

                  <div className={styles['course-image']}>

                    <img 

                      src={courseGif} 

                      alt={`${currentCourse.name} Programming`} 

                      className={styles['course-gif']}

                    />

                  </div>



                  <div className={styles['course-info']}>

                    <span className={styles['course-label']}>COURSE</span>

                    <h1 className={styles['course-name']}>{currentCourse.name}</h1>

                    <p className={styles['next-exercise']}>{currentCourse.nextExercise}</p>

                  </div>



                  <div className={styles['course-actions']}>

                    <button

                      type="button"

                      className={styles['continue-btn']}

                      onClick={() => navigate(courseRoute)}

                    >

                      Continue Learning

                    </button>

                  </div>

                </div>

              </div>

            </>

          )}

        </div>



        <div className={styles['right-section']}>

          {hasTouchedCourse && <div className={styles.courseTitleSpacer} />}

          <div className={styles['profile-card']}>

            <div className={styles['profile-header']}>

              <div className={styles.avatar}>

                {characterIcon ? (

                  <img

                    src={characterIcon}

                    alt="Avatar"

                    style={{ width: '70%', height: '70%', objectFit: 'contain', imageRendering: 'pixelated' }}

                  />

                ) : (

                  '👤'

                )}

              </div>

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