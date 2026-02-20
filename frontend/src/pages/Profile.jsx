import React, { useState, useEffect } from 'react';

import styles from '../styles/Profile.module.css';

import { Code, FileCode2, Terminal, LogOut, Trash2, Edit2, Calendar } from 'lucide-react';

const profileBanner = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770453646/profile-banner_wuyk83.jpg';
import { useDeleteAccount } from '../services/deleteAccount';
import { useEditAccount } from '../services/editAccount';
import useGetProfile from '../services/getProfile';
// Character icons from Cloudinary
const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';
const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';
const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';
const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';

import pythonBadge1 from '../assets/badges/Python/python-badge1.png';

import pythonBadge2 from '../assets/badges/Python/python-badge2.png';

import pythonBadge3 from '../assets/badges/Python/python-badge3.png';

import pythonBadge4 from '../assets/badges/Python/python-badge4.png';

import cppBadge1 from "../assets/badges/C++/cpp-badges1.png";
import cppBadge2 from "../assets/badges/C++/cpp-badges2.png";
import cppBadge3 from "../assets/badges/C++/cpp-badge3.png";
import cppBadge4 from "../assets/badges/C++/cpp-badge4.png";

import jsStage1Badge from "../assets/badges/JavaScript/js-stage1.png";

import jsStage2Badge from "../assets/badges/JavaScript/js-stage2.png";

import jsStage3Badge from "../assets/badges/JavaScript/js-stage3.png";

import jsStage4Badge from "../assets/badges/JavaScript/js-stage4.png";

import achievementsConfig from "../utilities/data/achievements.json";

import useGetAchievements from "../services/getUserAchievements";

import useProfileSummary from "../services/useProfileSummary";

import useLearningProgress from "../services/useLearningProgress";

const badgeImageById = {

  divine_warrior: pythonBadge3,

  python_master: pythonBadge1,

  bug_hunter: pythonBadge2,

  speed_coder: cppBadge1,

  first_steps: pythonBadge1,

};

const defaultBadgeImage = pythonBadge2;

const badgeImageByKey = {

  // JavaScript badges

  "js-stage1": jsStage1Badge,

  "js-stage2": jsStage2Badge,

  "js-stage3": jsStage3Badge,

  "js-stage4": jsStage4Badge,

  // Python badges

  "python-stage1": pythonBadge1,

  "python-stage2": pythonBadge2,

  "python-stage3": pythonBadge3,

  "python-stage4": pythonBadge4,

  // C++ badges

  "cpp-stage1": cppBadge1,

  "cpp-stage2": cppBadge2,

  "cpp-stage3": cppBadge3,

  "cpp-stage4": cppBadge4,

};

const Profile = ({ onSignOut }) => {

  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' or 'learningProgress'

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  const { achievements, loading } = useGetAchievements();

  const { totalXp, badgeCount, loading: summaryLoading } = useProfileSummary();

  const { progress, loading: progressLoading } = useLearningProgress();

  const deleteAccount = useDeleteAccount();

  const editAccount = useEditAccount();

  const getProfile = useGetProfile();

  const [editFormData, setEditFormData] = useState(() => ({
    userName: localStorage.getItem('fullName') || localStorage.getItem('username') || 'Unknown',
    username: localStorage.getItem('username') ? `@${localStorage.getItem('username')}` : '@',
    characterIcon: localStorage.getItem('selectedCharacterIcon') || '',
  }));

  useEffect(() => {

    const loadProfile = async () => {

      let response;

      try {

        response = await getProfile();

      } catch {

        return;

      }

      if (!response) return;

      const profile = response?.data;

      if (!profile) return;

      const nextUsername = profile?.username || '';

      const nextFullName = profile?.full_name || '';

      const nextCharacterId =

        profile?.character_id === null || profile?.character_id === undefined

          ? null

          : Number(profile.character_id);

      if (nextUsername) localStorage.setItem('username', nextUsername);

      if (nextFullName) localStorage.setItem('fullName', nextFullName);

      if (nextCharacterId !== null && !Number.isNaN(nextCharacterId)) {

        localStorage.setItem('selectedCharacter', String(nextCharacterId));

        const expectedIcon = {

          0: characterIcon1,

          1: characterIcon0,

          2: characterIcon2,

          3: characterIcon3,

        }[nextCharacterId] || null;

        if (expectedIcon) {

          localStorage.setItem('selectedCharacterIcon', expectedIcon);

        } else {

          localStorage.removeItem('selectedCharacterIcon');

        }

      }

      setEditFormData(prev => {

        const displayUsername = nextUsername ? `@${nextUsername}` : prev.username;

        const displayFullName = nextFullName;

        const nextIcon =

          nextCharacterId !== null && !Number.isNaN(nextCharacterId)

            ? {

                0: characterIcon1,

                1: characterIcon0,

                2: characterIcon2,

                3: characterIcon3,

              }[nextCharacterId] || ''

            : prev.characterIcon;

        return {

          ...prev,

          userName: displayFullName,

          username: displayUsername,

          characterIcon: nextIcon,

        };

      });

    };

    loadProfile();

  }, []);

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

        const storedIcon = localStorage.getItem('selectedCharacterIcon') || '';

        setEditFormData(prev => ({

          ...prev,

          characterIcon: storedIcon,

        }));

        return;

      }



      const expectedIcon = iconByCharacterId[storedCharacterId] || null;

      if (expectedIcon) {

        localStorage.setItem('selectedCharacterIcon', expectedIcon);

      } else {

        localStorage.removeItem('selectedCharacterIcon');

      }



      setEditFormData(prev => ({

        ...prev,

        characterIcon: expectedIcon || '',

      }));

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



    return () => {

      window.removeEventListener('storage', handleStorageChange);

      window.removeEventListener('characterUpdated', handleCharacterUpdate);

    };

  }, []);



  const learningProgress = {
    python: { completed: 0, total: 0, icon: <Terminal size={20} /> },
    cpp: { completed: 0, total: 0, icon: <Code size={20} /> },
    javascript: { completed: 0, total: 0, icon: <FileCode2 size={20} /> }
  };

  if (progress && Array.isArray(progress)) {
    progress.forEach(item => {
      if (item.programming_language_id === 1) {
        learningProgress.python.completed = item.completed;
        learningProgress.python.total = item.total;
      }

      if (item.programming_language_id === 2) {
        learningProgress.cpp.completed = item.completed;
        learningProgress.cpp.total = item.total;
      }

      if (item.programming_language_id === 3) {
        learningProgress.javascript.completed = item.completed;
        learningProgress.javascript.total = item.total;
      }
    });
  }



  const badges = achievements.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    received: a.earned_at
      ? new Date(a.earned_at).toLocaleString()
      : "Locked",
    badgeKey: a.badge_key
  }));




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



  const handleConfirmDelete = async () => {

    try {

      await deleteAccount();

    } catch (error) {

      console.error('Delete account failed:', error);

      return;

    }

    // Get username before removing it

    const username = localStorage.getItem('username');

    

    localStorage.removeItem('isAuthenticated');

    localStorage.removeItem('username');

    localStorage.removeItem('fullName');

    localStorage.removeItem('selectedCharacter');

    localStorage.removeItem('selectedCharacterIcon');

    localStorage.removeItem('hasSeenOnboarding');

    localStorage.removeItem('hasCompletedOnboarding');

    localStorage.removeItem('hasTouchedCourse');

    localStorage.removeItem('lastCourseTitle');

    localStorage.removeItem('lastCourseRoute');

    localStorage.removeItem('earnedAchievements'); // Clear badges on account deletion

    

    // Clear completed exercises for this user

    if (username) {

      localStorage.removeItem(`${username}_javascript_completed_exercises`);

      localStorage.removeItem(`${username}_cpp_completed_exercises`);

      localStorage.removeItem(`${username}_python_completed_exercises`);

    }

    // Also clear the general completed exercises

    localStorage.removeItem('javascript_completed_exercises');

    localStorage.removeItem('cpp_completed_exercises');

    localStorage.removeItem('python_completed_exercises');



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



  const handleSaveEdit = async () => {

    try {

      const response = await editAccount(editFormData.userName);



      if (response?.full_name) {

        localStorage.setItem('fullName', response.full_name);

      }



      setEditFormData(prev => ({

        ...prev,

        userName: response?.full_name || prev.userName,

      }));



      setIsEditModalOpen(false);

    } catch (error) {

      console.error('Edit account failed:', error);

    }

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

                {editFormData.characterIcon ? (

                  <img 

                    src={editFormData.characterIcon} 

                    alt="Character Avatar" 

                    className={styles.avatarImage}

                  />

                ) : (

                  (editFormData.userName || editFormData.username || 'U')

                    .replace(/^@+/, '')

                    .trim()

                    .charAt(0)

                    .toUpperCase()

                )}

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

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              Loading achievements...
            </div>
          ) : badges.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              No achievements earned yet.
            </div>
          ) : (
            <>
              <div className={styles.tableHeader}>
                <span>Badge</span>
                <span>Title</span>
                <span>Received</span>
              </div>

              {badges.map(badge => (
                <div key={badge.id} className={styles.tableRow}>
                  <img
                    className={styles.badgeIcon}
                    src={badge.badgeKey || defaultBadgeImage}
                    alt={badge.title}
                  />
                  <div>
                    <div>{badge.title}</div>
                    <div>{badge.description}</div>
                  </div>
                  <div>{badge.received}</div>
                </div>
              ))}
            </>
          )}

        </div>
      )}

          

          {activeTab === 'learningProgress' && (

            <div className={styles.learningProgressContainer}>

              <h3 className={styles.progressTitle}>Your Learning Progress</h3>

              <div className={styles.progressGrid}>

                {Object.entries(learningProgress).map(([language, { completed, total, icon }]) => (

                  <div key={language} className={styles.progressItem}>

                    <div className={styles.progressHeader}>

                      <div className={styles.languageInfo}>

                        <span className={styles.languageIcon}>{icon}</span>

                        <span className={styles.languageName}>

                          {language === 'cpp' ? 'C++' : language.charAt(0).toUpperCase() + language.slice(1)}

                        </span>

                      </div>

                      <span className={styles.progressText}>{completed} / {total}</span>

                    </div>

                    <div className={styles.progressBar}>

                      <div 

                        className={styles.progressFill} 

                        style={{
                          width: total === 0
                            ? "0%"
                            : `${(completed / total) * 100}%`
                        }}

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

              <div className={styles.sidebarCardStatValue}>{summaryLoading ? "..." : totalXp}</div>

              <div className={styles.sidebarCardStatLabel}>Total XP</div>

            </div>

            <div className={styles.sidebarCardStat}>

              <div className={styles.sidebarCardStatValue}>{summaryLoading ? "..." : badgeCount}</div>

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