import React, { useState, useEffect } from 'react';
import styles from '../styles/Profile.module.css';
import { Code, FileCode2, Terminal, LogOut, Trash2, Edit2 } from 'lucide-react';
import useGetProfile from '../services/getProfile';

const Profile = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState('achievements');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ userName: '', username: '' });
  const [learningProgress, setLearningProgress] = useState({});
  const getProfile = useGetProfile();

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getProfile();
      if (data) {
        setProfile(data);
        setEditFormData({
          userName: data.fullName || data.username || '',
          username: '@' + (data.username || ''),
        });
        // Example: you can also set progress based on API
        setLearningProgress({
          python: { progress: data.pythonProgress || 0, total: 100, icon: <Terminal size={20} /> },
          cpp: { progress: data.cppProgress || 0, total: 100, icon: <Code size={20} /> },
          javascript: { progress: data.jsProgress || 0, total: 100, icon: <FileCode2 size={20} /> }
        });
      }
    };
    fetchProfile();
  }, []);

  const handleSignOut = () => setIsSignOutConfirmOpen(true);
  const handleConfirmSignOut = () => {
    if (onSignOut) onSignOut();
    setIsSignOutConfirmOpen(false);
  };
  const handleCancelSignOut = () => setIsSignOutConfirmOpen(false);

  const handleDeleteAccount = () => setIsDeleteConfirmOpen(true);
  const handleConfirmDelete = () => {
    console.log('Account deleted');
    setIsDeleteConfirmOpen(false);
  };
  const handleCancelDelete = () => setIsDeleteConfirmOpen(false);

  const handleEditAccount = () => setIsEditModalOpen(true);
  const handleSaveEdit = () => {
    console.log('Account updated:', editFormData);
    setIsEditModalOpen(false);
  };
  const handleEditInputChange = e => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.profileInfo}>
            <div className={styles.avatar}>{profile.username?.charAt(0).toUpperCase()}</div>
            <div className={styles.userDetails}>
              <div className={styles.userNameContainer}>
                <h1 className={styles.userName}>{editFormData.userName}</h1>
                <button className={styles.editIconBtn} onClick={handleEditAccount} title="Edit Account">
                  <Edit2 size={20} />
                </button>
              </div>
              <p className={styles.username}>{editFormData.username}</p>
              <div className={styles.stats}>
                <span className={styles.joinedDate}>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
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
              {/* Map real achievements here */}
              {profile.achievements?.map((ach, idx) => (
                <div key={idx} className={styles.tableRow}>
                  <div className={styles.badgeCell}>
                    <img src={ach.icon} alt={ach.title} className={styles.badgeIcon} />
                  </div>
                  <div className={styles.achievementCell}>{ach.title}</div>
                  <div className={styles.timeCell}>{ach.receivedAt}</div>
                </div>
              ))}
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
                        <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
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

      {/* Modals (Edit, Delete, Sign Out) */}
      {/* ... Keep the modals unchanged ... */}
    </div>
  );
};

export default Profile;
