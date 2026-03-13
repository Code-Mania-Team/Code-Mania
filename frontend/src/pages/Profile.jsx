import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';



import styles from '../styles/Profile.module.css';



import { Code, FileCode2, Terminal, LogOut, Trash2, Edit2, Calendar } from 'lucide-react';



const profileBanner = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770453646/profile-banner_wuyk83.jpg';

const LANGUAGE_LOGOS = {
  python: "https://res.cloudinary.com/daegpuoss/image/upload/v1766925752/python_gwzofh.png",
  cpp: "https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/C_tvqhay.png",
  cplusplus: "https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/C_tvqhay.png",
  "c++": "https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/C_tvqhay.png",
  javascript: "https://res.cloudinary.com/daegpuoss/image/upload/v1766925756/javascript_pypygq.jpg",
  js: "https://res.cloudinary.com/daegpuoss/image/upload/v1766925756/javascript_pypygq.jpg",
};

const normalizeLanguageSlug = (raw) => {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "c++") return "cpp";
  return value;
};

import { useDeleteAccount } from '../services/deleteAccount';

import { useEditAccount } from '../services/editAccount';

import useGetProfile from '../services/getProfile';

import useProfileSummary from '../services/useProfileSummary';

import useLearningProgress from '../services/useLearningProgress';

import useGetPublicProfile from '../services/getPublicProfile';

import usePublicProfileSummary from '../services/usePublicProfileSummary';

import usePublicLearningProgress from '../services/usePublicLearningProgress';

import useGetAchievements from '../services/getUserAchievements';

import useGetPublicAchievements from '../services/getPublicAchievements';

import useGetQuizAttempts from "../services/getQuizAttempts";

import useGetExamAttempts from "../services/getExamAttempts";

// Character icons from Cloudinary

const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';

const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';

const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';

const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';

const FULL_NAME_MAX_LENGTH = 40;
const EDIT_NAME_COOLDOWN_MS = 60 * 1000;



const Profile = ({ onSignOut }) => {

  const { username: routeUsernameParam } = useParams();
  const routeUsername = routeUsernameParam ? String(routeUsernameParam) : '';
  const selfUsername = String(localStorage.getItem('username') || '').trim();
  const isViewingOtherProfile =
    Boolean(routeUsername) &&
    routeUsername.toLowerCase() !== selfUsername.toLowerCase();



  const [activeTab, setActiveTab] = useState('achievements'); // achievements | learningProgress | assessments



  const [isEditModalOpen, setIsEditModalOpen] = useState(false);



  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);



  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  const [fullNameDraft, setFullNameDraft] = useState('');

  const [editError, setEditError] = useState('');

  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editCooldownSeconds, setEditCooldownSeconds] = useState(0);

  const getEditCooldownKey = () => {
    const username = localStorage.getItem('username') || 'guest';
    return `profileNameLastEditAt_${username}`;
  };

  const getCooldownRemainingSeconds = () => {
    const raw = localStorage.getItem(getEditCooldownKey());
    if (!raw) return 0;

    const lastEditedAt = Number(raw);
    if (!Number.isFinite(lastEditedAt)) return 0;

    const remainingMs = EDIT_NAME_COOLDOWN_MS - (Date.now() - lastEditedAt);
    if (remainingMs <= 0) return 0;

    return Math.ceil(remainingMs / 1000);
  };



  const deleteAccount = useDeleteAccount();



  const editAccount = useEditAccount();



  const getProfile = useGetProfile();

  const getPublicProfile = useGetPublicProfile();



  const [editFormData, setEditFormData] = useState(() => ({

    userName: localStorage.getItem('fullName') || localStorage.getItem('username') || 'Unknown',

    username: localStorage.getItem('username') ? `@${localStorage.getItem('username')}` : '@',

    characterIcon: localStorage.getItem('selectedCharacterIcon') || '',

  }));



  useEffect(() => {

     if (isViewingOtherProfile) return;

    if (isViewingOtherProfile) return;



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



        const displayFullName = nextFullName || prev.userName;



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



  }, [getProfile, isViewingOtherProfile]);

  useEffect(() => {
    if (!isViewingOtherProfile) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await getPublicProfile(routeUsername);
        const profile = response?.data;
        if (!response?.success || !profile) return;
        if (cancelled) return;

        const nextUsername = profile?.username || routeUsername;
        const nextFullName = profile?.full_name || nextUsername || 'Unknown';
        const nextCharacterId =
          profile?.character_id === null || profile?.character_id === undefined
            ? null
            : Number(profile.character_id);

        const iconByCharacterId = {
          0: characterIcon1,
          1: characterIcon0,
          2: characterIcon2,
          3: characterIcon3,
        };

        const nextIcon =
          nextCharacterId !== null && !Number.isNaN(nextCharacterId)
            ? (iconByCharacterId[nextCharacterId] || '')
            : '';

        setEditFormData((prev) => ({
          ...prev,
          userName: nextFullName,
          username: nextUsername ? `@${nextUsername}` : prev.username,
          characterIcon: nextIcon,
        }));

        setActiveTab('achievements');
      } catch {
        // ignore
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [getPublicProfile, isViewingOtherProfile, routeUsername]);



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



  }, [isViewingOtherProfile]);







  const { totalXp, badgeCount } = useProfileSummary();

  const { totalXp: publicTotalXp, badgeCount: publicBadgeCount } = usePublicProfileSummary(
    isViewingOtherProfile ? routeUsername : ''
  );

  const { progress: learningProgressRows } = useLearningProgress();

  const { progress: publicLearningProgressRows } = usePublicLearningProgress(
    isViewingOtherProfile ? routeUsername : ''
  );

  const { achievements } = useGetAchievements();

  const { achievements: publicAchievements } = useGetPublicAchievements(
    isViewingOtherProfile ? routeUsername : ''
  );

  const displayedTotalXp = isViewingOtherProfile ? publicTotalXp : totalXp;
  const displayedBadgeCount = isViewingOtherProfile ? publicBadgeCount : badgeCount;

  const effectiveLearningProgressRows = isViewingOtherProfile
    ? publicLearningProgressRows
    : learningProgressRows;

  const effectiveAchievements = isViewingOtherProfile
    ? publicAchievements
    : achievements;

  const getQuizAttempts = useGetQuizAttempts();

  const getExamAttempts = useGetExamAttempts();

  const [quizAttempts, setQuizAttempts] = useState([]);
  const [examAttempts, setExamAttempts] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState('');

  const learningProgress = {
    python: { progress: 0, total: 16, completed: 0, icon: <Terminal size={20} /> },
    cpp: { progress: 0, total: 16, completed: 0, icon: <Code size={20} /> },
    javascript: { progress: 0, total: 16, completed: 0, icon: <FileCode2 size={20} /> },
  };

  (effectiveLearningProgressRows || []).forEach((row) => {
    const languageId = Number(row?.programming_language_id);
    const languageById = {
      1: 'python',
      2: 'cpp',
      3: 'javascript',
    };

    const languageKey = languageById[languageId];
    if (!languageKey || !learningProgress[languageKey]) return;

    const completed = Number(row?.completed || 0);
    const total = Number(row?.total || 16);
    const computedProgress = total > 0
      ? Math.round((completed / total) * 100)
      : Number(row?.percentage || 0);

    learningProgress[languageKey] = {
      ...learningProgress[languageKey],
      progress: computedProgress,
      total,
      completed,
    };
  });

  const badges = (effectiveAchievements || []).map((item) => ({
    id: item?.id,
    title: item?.title || 'Achievement',
    description: item?.description || '',
    received: item?.earned_at
      ? new Date(item.earned_at).toLocaleString()
      : 'Locked',
    badgeUrl: item?.badge_key,
  }));

  useEffect(() => {
    if (isViewingOtherProfile) return;
    if (activeTab !== "assessments") return;
    if (assessmentsLoading) return;
    if (quizAttempts.length || examAttempts.length) return;

    let cancelled = false;

    const load = async () => {
      setAssessmentsLoading(true);
      setAssessmentsError('');
      try {
        const [quizRes, examRes] = await Promise.all([
          getQuizAttempts({ limit: 200 }),
          getExamAttempts({ limit: 200 }),
        ]);

        if (cancelled) return;

        const quizRows = quizRes?.success ? (quizRes?.data || []) : [];
        const examRows = examRes?.success ? (examRes?.data || []) : [];

        setQuizAttempts(Array.isArray(quizRows) ? quizRows : []);
        setExamAttempts(Array.isArray(examRows) ? examRows : []);

        if (!quizRes?.success || !examRes?.success) {
          setAssessmentsError(
            quizRes?.message || examRes?.message || 'Failed to load quiz/exam history'
          );
        }
      } catch (err) {
        if (cancelled) return;
        setAssessmentsError(err?.response?.data?.message || err?.message || 'Failed to load quiz/exam history');
      } finally {
        if (cancelled) return;
        setAssessmentsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [activeTab, isViewingOtherProfile]);







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
    setFullNameDraft(editFormData.userName || '');
    setEditError('');
    setEditCooldownSeconds(getCooldownRemainingSeconds());
    setIsEditModalOpen(true);



  };







  const handleSaveEdit = async () => {

    if (isSavingEdit) return;

    const remainingSeconds = getCooldownRemainingSeconds();
    if (remainingSeconds > 0) {
      setEditCooldownSeconds(remainingSeconds);
      setEditError(`Please wait ${remainingSeconds}s before changing your name again.`);
      return;
    }

    const normalizedName = (fullNameDraft || '').trim();

    if (!normalizedName) {

      setEditError('Full name is required.');

      return;

    }

    if (normalizedName.length > FULL_NAME_MAX_LENGTH) {

      setEditError(`Full name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`);

      return;

    }

    setEditError('');

    setIsSavingEdit(true);



    try {



      const response = await editAccount(normalizedName);







      if (response?.full_name) {



        localStorage.setItem('fullName', response.full_name);

        localStorage.setItem(getEditCooldownKey(), String(Date.now()));

        setEditCooldownSeconds(Math.ceil(EDIT_NAME_COOLDOWN_MS / 1000));



      }







      setEditFormData(prev => ({



        ...prev,



        userName: response?.full_name || prev.userName,



      }));







      setIsEditModalOpen(false);



    } catch (error) {



      console.error('Edit account failed:', error);

      setEditError(error?.response?.data?.message || 'Failed to update profile name.');



    } finally {

      setIsSavingEdit(false);

    }



  };







  const handleEditInputChange = (e) => {
    const value = String(e.target.value || '').slice(0, FULL_NAME_MAX_LENGTH);

    setFullNameDraft(value);

    if (editError) setEditError('');

  };

  useEffect(() => {
    if (!isEditModalOpen) return;

    setEditCooldownSeconds(getCooldownRemainingSeconds());

    const timer = setInterval(() => {
      setEditCooldownSeconds(getCooldownRemainingSeconds());
    }, 1000);

    return () => clearInterval(timer);
  }, [isEditModalOpen]);







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



              <h1 className={styles.userName} title={editFormData.userName}>{editFormData.userName}</h1>



              <p className={styles.username}>{editFormData.username}</p>



            </div>







            {!isViewingOtherProfile ? (
              <button className={styles.coverEditProfileBtn} onClick={handleEditAccount}>



              <Edit2 size={14} />



              Edit profile



              </button>
            ) : null}

            <div className={styles.mobileCoverStats}>
              <div className={styles.mobileCoverStatItem}>
                <span className={styles.mobileCoverStatValue}>{displayedTotalXp || 0}</span>
                <span className={styles.mobileCoverStatLabel}>XP</span>
              </div>
              <div className={styles.mobileCoverStatItem}>
                <span className={styles.mobileCoverStatValue}>{displayedBadgeCount || badges.length || 0}</span>
                <span className={styles.mobileCoverStatLabel}>Badges</span>
              </div>
            </div>



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

          {!isViewingOtherProfile ? (
            <button
              className={`${styles.tab} ${activeTab === 'assessments' ? styles.active : ''}`}
              onClick={() => setActiveTab('assessments')}
            >
              QUIZZES & EXAMS
            </button>
          ) : null}



        </div>







        {/* Tab Content */}



        <div className={styles.tabContent}>



          {activeTab === 'achievements' && (



            <div className={styles.achievementsTable}>



               {badges.length === 0 ? (
                 <div className={styles.emptyState}>
                   <p>No achievements earned yet.</p>
                   <p className={styles.emptyStateSecondary}>Complete exercises to unlock badges!</p>
                 </div>



              ) : (



                <>



                  <div className={styles.tableHeader}>



                    <span className={styles.badgeHeader}>Badges</span>



                    <span className={styles.achievementHeader}>Achievements</span>



                    <span className={styles.receivedHeader}>Received</span>



                  </div>



                  {badges.map((badge) => (



                    <div key={badge.id} className={styles.tableRow}>



                      <div className={styles.badgeCell}>



                        <img



                          className={styles.badgeIcon}



                          src={badge.badgeUrl || "/default-badge.png"}



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



                </>



              )}



            </div>



          )}



          



          {activeTab === 'learningProgress' && (



            <div className={styles.learningProgressContainer}>



              <h3 className={styles.progressTitle}>Your Learning Progress</h3>



              <div className={styles.progressGrid}>



                {Object.entries(learningProgress).map(([language, { progress, completed, total, icon }]) => (



                  <div key={language} className={styles.progressItem}>



                    <div className={styles.progressHeader}>



                      <div className={styles.languageInfo}>



                        <span className={styles.languageIcon}>{icon}</span>



                        <span className={styles.languageName}>



                          {language === 'cpp' ? 'C++' : language.charAt(0).toUpperCase() + language.slice(1)}



                        </span>



                      </div>  



                      <span className={styles.progressText}>{completed}/{total}</span>



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

          {activeTab === 'assessments' && !isViewingOtherProfile && (
            <div className={styles.assessmentsContainer}>
              <h3 className={styles.progressTitle}>Your Quiz & Exam History</h3>

              <div className={styles.assessmentsSection}>
                <div className={styles.assessmentsSectionTitle}>Quizzes</div>
                {quizAttempts.length === 0 ? (
                  <div className={styles.assessmentsEmpty}>
                    No quiz attempts yet.
                  </div>
                ) : (
                  <div className={styles.historyTable}>
                    <div className={styles.historyHeader}>
                      <span>Type</span>
                      <span>Score</span>
                      <span>XP</span>
                      <span>Date</span>
                    </div>
                    {quizAttempts.map((a) => (
                      <div key={`quiz-${a.id}`} className={styles.historyRow}>
                        <div className={styles.historyMain}>
                          <div className={styles.historyTitle}>
                            <span className={styles.historyType}>
                              <img
                                className={styles.historyLangLogo}
                                src={LANGUAGE_LOGOS[normalizeLanguageSlug(a.language)] || LANGUAGE_LOGOS.javascript}
                                alt={String(a.language || "language").toUpperCase()}
                                loading="lazy"
                              />
                              <span className={styles.historyTypeText}>-</span>
                            </span>
                            {a.quizTitle || 'Quiz'}
                          </div>
                          <div className={styles.historyMeta}>
                            {a.isPassed ? 'Passed' : 'Failed'}
                            {Number.isFinite(Number(a.totalQuestions)) && Number(a.totalQuestions) > 0
                              ? ` • ${a.totalCorrect}/${a.totalQuestions}`
                              : ''}
                          </div>
                        </div>

                        <div className={styles.historyStat}>
                          {Math.round(Number(a.scorePercentage || 0))}%
                        </div>

                        <div className={styles.historyStat}>
                          {Number(a.earnedXp || 0)}
                        </div>

                        <div className={styles.historyDate}>
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.assessmentsSection}>
                <div className={styles.assessmentsSectionTitle}>Exams</div>
                {examAttempts.length === 0 ? (
                  <div className={styles.assessmentsEmpty}>
                    No exam attempts yet.
                  </div>
                ) : (
                  <div className={styles.historyTable}>
                    <div className={styles.historyHeader}>
                      <span>Type</span>
                      <span>Attempt</span>
                      <span>XP</span>
                      <span>Date</span>
                    </div>
                    {examAttempts.map((a) => {
                      const title = a?.exam_problems?.problem_title || 'Exam';
                      const lang = a?.exam_problems?.programming_languages?.slug || a?.language || '';
                      const attemptNo = Number(a?.attempt_number || 0);
                      const score = Math.round(Number(a?.score_percentage || 0));
                      const passed = Boolean(a?.passed);
                      const xp = Number(a?.earned_xp || 0);
                      const submittedAt = a?.created_at;

                      return (
                        <div key={`exam-${a.id}`} className={styles.historyRow}>
                          <div className={styles.historyMain}>
                            <div className={styles.historyTitle}>
                              <span className={styles.historyType}>
                                <img
                                  className={styles.historyLangLogo}
                                  src={LANGUAGE_LOGOS[normalizeLanguageSlug(lang)] || LANGUAGE_LOGOS.javascript}
                                  alt={String(lang || "language").toUpperCase()}
                                  loading="lazy"
                                />
                                <span className={styles.historyTypeText}>-</span>
                              </span>
                              {title}
                            </div>
                            <div className={styles.historyMeta}>
                              {passed ? 'Passed' : 'In Progress/Failed'} • {score}%
                            </div>
                          </div>

                          <div className={styles.historyStat}>
                            {attemptNo}/5
                          </div>

                          <div className={styles.historyStat}>
                            {xp}
                          </div>

                          <div className={styles.historyDate}>
                            {submittedAt ? new Date(submittedAt).toLocaleString() : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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



                value={fullNameDraft}



                onChange={handleEditInputChange}

                maxLength={FULL_NAME_MAX_LENGTH}



                className={styles.formInput}



              />

              <small style={{ display: 'block', marginTop: '8px', opacity: 0.7 }}>

                {fullNameDraft.length}/{FULL_NAME_MAX_LENGTH}

              </small>

              {editError ? (

                <p style={{ marginTop: '8px', color: '#f87171', fontSize: '0.9rem' }}>{editError}</p>

              ) : null}



            </div>



            <div className={styles.modalButtons}>



              <button
                className={styles.cancelBtn}
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSavingEdit}
              >



                Cancel



              </button>



              <button
                className={styles.saveBtn}
                onClick={handleSaveEdit}
                disabled={isSavingEdit || editCooldownSeconds > 0}
              >



                {isSavingEdit
                  ? 'Editing...'
                  : editCooldownSeconds > 0
                    ? `Wait ${editCooldownSeconds}s`
                    : 'Save Changes'}



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



        <div className={`${styles.sidebarCard} ${styles.desktopStatsCard}`}>



          <div className={styles.sidebarCardTitle} title={editFormData.userName}>{editFormData.userName}</div>



          <div className={styles.sidebarCardStatRow}>



            <div className={styles.sidebarCardStat}>



              <div className={styles.sidebarCardStatValue}>{displayedTotalXp || 0}</div>



              <div className={styles.sidebarCardStatLabel}>Total XP</div>



            </div>



            <div className={styles.sidebarCardStat}>



              <div className={styles.sidebarCardStatValue}>{displayedBadgeCount || badges.length || 0}</div>



              <div className={styles.sidebarCardStatLabel}>Badges</div>



            </div>



          </div>



        </div>







        <div className={`${styles.sidebarCard} ${styles.learningProgramCard}`}>



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







        {!isViewingOtherProfile ? (
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
        ) : null}



      </aside>



      </div>



    </div>



  );



};







export default Profile;
