import React, { useState } from 'react';
import styles from '../styles/Profile.module.css';
import { Code, FileCode2, Terminal, LogOut, Trash2, Edit2 } from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' or 'learningProgress'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    userName: 'Jet Padilla',
    username: '@Jet.padilla'
  });
  
  const [learningProgress] = useState({
    python: { progress: 0, total: 100, icon: <Terminal size={20} /> },
    cpp: { progress: 0, total: 100, icon: <Code size={20} /> },
    javascript: { progress: 0, total: 100, icon: <FileCode2 size={20} /> }
  });

  const handleSignOut = () => {
    setIsSignOutConfirmOpen(true);
  };

  const handleConfirmSignOut = () => {
    // Add sign out logic here
    console.log('User signed out');
    setIsSignOutConfirmOpen(false);
    // window.location.href = '/login'; // Redirect to login
  };

  const handleCancelSignOut = () => {
    setIsSignOutConfirmOpen(false);
  };

  const handleDeleteAccount = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    // Add delete account logic here
    console.log('Account deleted');
    setIsDeleteConfirmOpen(false);
    // window.location.href = '/'; // Redirect to home
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
      <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>J</div>
          <div className={styles.userDetails}>
            <div className={styles.userNameContainer}>
              <h1 className={styles.userName}>Jet Padilla</h1>
              <button className={styles.editIconBtn} onClick={handleEditAccount} title="Edit Account">
                <Edit2 size={20} />
              </button>
            </div>
            <p className={styles.username}>@Jet.padilla</p>
            <div className={styles.stats}>
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
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.formLabel}>Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={editFormData.username}
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
        <div className={styles.sidebarBottom}>
          <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign Out">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
          <button className={styles.deleteBtn} onClick={handleDeleteAccount} title="Delete Account">
            <Trash2 size={18} />
            <span>Delete Account</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Profile;