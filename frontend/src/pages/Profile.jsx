import React, { useState } from 'react';
import styles from '../styles/Profile.module.css';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' or 'certificates'

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>J</div>
          <div className={styles.userDetails}>
            <h1 className={styles.userName}>Jet Padilla</h1>
            <p className={styles.username}>@Jet.padilla</p>
            <div className={styles.stats}>
              <span>0 Following</span>
              <span>0 Followers</span>
              <span className={styles.joinedDate}>Joined Oct 2023</span>
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
          className={`${styles.tab} ${activeTab === 'certificates' ? styles.active : ''}`}
          onClick={() => setActiveTab('certificates')}
        >
          CERTIFICATES
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
        
        {activeTab === 'certificates' && (
          <div className={styles.tabContent}>
            <div className={styles.certificatesList}>
              <p className={styles.emptyState}>COMING SOON!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
