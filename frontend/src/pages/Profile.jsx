import React, { useState } from 'react';
import styles from '../styles/Profile.module.css';
import { Code, FileCode2, Terminal } from 'lucide-react';
// import { useAuth } from '../context/authProvider';
import { useProfile } from "../hooks/useProfile";


const Profile = () => {
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' or 'learningProgress'
  const { profile: user, loading } = useProfile();
  console.log("User profile data:", user);
  console.log("Loading state:", loading);
  console.log("User profile:", user?.data?.username);


  
  const [learningProgress] = useState({
    python: { progress: 0, total: 100, icon: <Terminal size={20} /> },
    cpp: { progress: 0, total: 100, icon: <Code size={20} /> },
    javascript: { progress: 0, total: 100, icon: <FileCode2 size={20} /> }
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>{user?.data?.username ? user?.data?.username[0].toUpperCase() : ""}</div>
          <div className={styles.userDetails}>
            <h1 className={styles.userName}>{user?.data?.fullName || "Loading..."}</h1>
            <p className={styles.username}>@{user?.data?.username || ""}</p>
            <div className={styles.stats}>
              <span>0 Following</span>
              <span>0 Followers</span>
              <span className={styles.joinedDate}>Joined {user?.data?.created_at
                ? new Date(user?.data?.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}</span>
            </div>
          </div>
        </div>
        <div className={styles.rankSection}>
          <div className={styles.rankItem}>
            <div className={styles.rankNumber}>#0</div>
            <div className={styles.rankLabel}>Rank</div>
          </div>
          <div className={styles.rankItem}>
            <div className={styles.rankNumber}>0</div>
            <div className={styles.rankLabel}>Badges</div>
          </div>
          <div className={styles.rankItem}>
            <div className={styles.rankNumber}>0</div>
            <div className={styles.rankLabel}>EXP</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'achievements' ? styles.active : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          ACHIEVEMENTS
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'learningProgress' ? styles.active : ''}`}
          onClick={() => setActiveTab('learningProgress')}
        >
          LEARNING PROGRESS
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'achievements' && (
          <div className={styles.achievementsTable}>
            <div className={styles.tableHeader}>
              <span>Badges</span>
              <span>Achievements</span>
              <span>Received</span>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.badgeCell}>
                <img src="/images/divine-warrior.png" alt="Divine Warrior" className={styles.badgeIcon} />
              </div>
              <div className={styles.achievementCell}>Divine Warrior</div>
              <div className={styles.timeCell}>About 1 year</div>
            </div>
          </div>
        )}
        
        {activeTab === 'learningProgress' && (
          <div className={styles.tabContent}>
            <div className={styles.learningProgressContainer}>
              <h3 className={styles.progressTitle}>Your Learning Progress</h3>
              <div className={styles.progressGrid}>
                {Object.entries(learningProgress).map(([language, { progress, total, icon }]) => (
                  <div key={language} className={styles.progressItem}>
                    <div className={styles.progressHeader}>
                      <div className={styles.languageInfo}>
                        <span className={styles.languageIcon}>{icon}</span>
                        <span className={styles.languageName}>
                          {language === 'cpp' ? 'C++' : language.charAt(0).toUpperCase() + language.slice(1)}
                        </span>
                      </div>
                      <span className={styles.progressText}>{progress}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
