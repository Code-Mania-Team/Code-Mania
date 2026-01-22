import React, { useState } from 'react';
import styles from '../styles/Profile.module.css';
import { Code, FileCode2, Terminal, LogOut, Trash2, Edit2, Calendar } from 'lucide-react';
import profileBanner from '../assets/profile-banner.jpg';

import pythonBadge1 from '../assets/badges/Python/python-badge1.png';
import pythonBadge2 from '../assets/badges/Python/python-badge2.png';
import pythonBadge3 from '../assets/badges/Python/python-badge3.png';
import cppBadge1 from '../assets/badges/C++/c++-badges1.png';

const badgeImageById = {
  divine_warrior: pythonBadge3,
  python_master: pythonBadge1,
  bug_hunter: pythonBadge2,
  speed_coder: cppBadge1,
  first_steps: pythonBadge1,
};

const defaultBadgeImage = pythonBadge2;

const Profile = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' or 'learningProgress'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(() => {
    const storedUsername = localStorage.getItem('username') || '';
    const storedFullName = localStorage.getItem('fullName') || '';
    const displayUsername = storedUsername ? `@${storedUsername}` : '@';
    const displayFullName = storedFullName || storedUsername || 'Jet Padilla';

    return {
      userName: displayFullName,
      username: displayUsername,
    };
  });
  
  const [learningProgress] = useState({
    python: { progress: 0, total: 100, icon: <Terminal size={20} /> },
    cpp: { progress: 0, total: 100, icon: <Code size={20} /> },
    javascript: { progress: 0, total: 100, icon: <FileCode2 size={20} /> }
  });

  const [badges] = useState([
    {
      id: 'divine_warrior',
      title: 'Divine Warrior',
      description: 'Complete 100 coding challenges',
      received: 'About 1 year ago'
    },
    {
      id: 'python_master',
      title: 'Python Master',
      description: 'Complete all Python exercises',
      received: '6 months ago'
    },
    {
      id: 'bug_hunter',
      title: 'Bug Hunter',
      description: 'Fix 50 bugs in exercises',
      received: '3 months ago'
    },
    {
      id: 'speed_coder',
      title: 'Speed Coder',
      description: 'Complete 10 exercises in under 5 minutes each',
      received: '1 month ago'
    },
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Complete your first coding exercise',
      received: '1 year ago'
    }
  ]);

  const handleSignOut = () => {
    setIsSignOutConfirmOpen(true);
  };

  const handleConfirmSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
    setIsSignOutConfirmOpen(false);
    // Optionally redirect to home page after sign out
    window.location.href = '/';
  };

  const handleCancelSignOut = () => {
    setIsSignOutConfirmOpen(false);
  };

  const handleDeleteAccount = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    localStorage.removeItem('selectedCharacter');
    localStorage.removeItem('hasSeenOnboarding');
    localStorage.removeItem('hasCompletedOnboarding');
    localStorage.removeItem('hasTouchedCourse');
    localStorage.removeItem('lastCourseTitle');
    localStorage.removeItem('lastCourseRoute');

    window.dispatchEvent(new Event('authchange'));
    setIsDeleteConfirmOpen(false);
    window.location.href = '/';
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleEditAccount = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    // Add save logic here
    console.log('Account updated:', editFormData);

    const normalizedUsername = (editFormData.username || '').trim().replace(/^@+/, '');
    localStorage.setItem('username', normalizedUsername);
    localStorage.setItem('fullName', (editFormData.userName || '').trim() || normalizedUsername);

    setEditFormData(prev => ({
      ...prev,
      userName: (prev.userName || '').trim() || normalizedUsername,
      username: normalizedUsername ? `@${normalizedUsername}` : '@',
    }));
    setIsEditModalOpen(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.coverBanner}>
        <img className={styles.coverBannerImage} src={profileBanner} alt="" />
        <div className={styles.coverOverlay}>
          <div className={styles.coverOverlayInner}>
            <div className={styles.coverAvatarContainer}>
              <div className={styles.avatar}>
                {(editFormData.userName || editFormData.username || 'U')
                  .replace(/^@+/, '')
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>

            <div className={styles.coverUserInfo}>
              <div className={styles.joinDate}>
                <Calendar size={16} />
                <span>Joined Jan 2026</span>
              </div>
              <h1 className={styles.userName}>{editFormData.userName}</h1>
              <p className={styles.username}>{editFormData.username}</p>
            </div>

            <button className={styles.coverEditProfileBtn} onClick={handleEditAccount}>
              <Edit2 size={14} />
              Edit profile
            </button>
          </div>
        </div>
      </div>
      <div className={styles.layout}>
      <div className={styles.container}>
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

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'achievements' && (
            <div className={styles.achievementsTable}>
              <div className={styles.tableHeader}>
                <span>Badges</span>
                <span>Achievements</span>
                <span>Received</span>
              </div>
              {badges.map((badge) => (
                <div key={badge.id} className={styles.tableRow}>
                  <div className={styles.badgeCell}>
                    <img
                      className={styles.badgeIcon}
                      src={badgeImageById[badge.id] || defaultBadgeImage}
                      alt={badge.title}
                    />
                  </div>
                  <div className={styles.achievementCell}>
                    <div className={styles.achievementTitle}>{badge.title}</div>
                    <div className={styles.achievementDescription}>{badge.description}</div>
                  </div>
                  <div className={styles.timeCell}>{badge.received}</div>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'learningProgress' && (
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
          )}
        </div>


      {/* Edit Account Modal */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Edit Account</h2>
            <div className={styles.formGroup}>
              <label htmlFor="userName" className={styles.formLabel}>Full Name</label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={editFormData.userName}
                onChange={handleEditInputChange}
                className={styles.formInput}
              />
            </div>
            <div className={styles.modalButtons}>
              <button className={styles.cancelBtn} onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className={styles.modalOverlay} onClick={handleCancelDelete}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Delete Account</h2>
            <p className={styles.confirmMessage}>
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className={styles.modalButtons}>
              <button className={styles.cancelBtn} onClick={handleCancelDelete}>
                Cancel
              </button>
              <button className={styles.deleteConfirmBtn} onClick={handleConfirmDelete}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {isSignOutConfirmOpen && (
        <div className={styles.modalOverlay} onClick={handleCancelSignOut}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Sign Out</h2>
            <p className={styles.confirmMessage}>
              Are you sure you want to sign out?
            </p>
            <div className={styles.modalButtons}>
              <button className={styles.cancelBtn} onClick={handleCancelSignOut}>
                Cancel
              </button>
              <button className={styles.signOutConfirmBtn} onClick={handleConfirmSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Right Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarCard}>
          <div className={styles.sidebarCardTitle}>{editFormData.userName}</div>
          <div className={styles.sidebarCardStatRow}>
            <div className={styles.sidebarCardStat}>
              <div className={styles.sidebarCardStatValue}>0</div>
              <div className={styles.sidebarCardStatLabel}>Total XP</div>
            </div>
            <div className={styles.sidebarCardStat}>
              <div className={styles.sidebarCardStatValue}>0</div>
              <div className={styles.sidebarCardStatLabel}>Badges</div>
            </div>
          </div>
        </div>

        <div className={styles.sidebarCard}>
          <div className={styles.sidebarCardTitle}>Learning Program</div>
          <button
            className={styles.sidebarPrimaryBtn}
            onClick={() => {
              window.location.href = '/learn';
            }}
          >
            View Courses
          </button>
        </div>

        <div className={styles.sidebarCard}>
          <div className={styles.sidebarCardTitle}>Account</div>
          <div className={styles.sidebarBottom}>
            <button className={styles.deleteBtn} onClick={handleDeleteAccount} title="Delete Account">
              <Trash2 size={18} />
              <span>Delete Account</span>
            </button>
            <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign Out">
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
};

export default Profile;
