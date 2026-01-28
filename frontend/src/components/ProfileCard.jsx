import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileCard = ({ onSignInRequired }) => {
  const navigate = useNavigate();

  const userProgress = {
    name: localStorage.getItem('username') || 'Your Name',
    level: 1,
    exercisesCompleted: 0,
    totalExercises: 16,
    xpEarned: 0,
    totalXp: 3600
  };

  const characterIcon = localStorage.getItem('selectedCharacterIcon') || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=user';

  const handleViewProfile = () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      onSignInRequired();
    }
  };

  return (
    <div className="profile-card">
      <div className="profile-avatar">
        <img src={characterIcon} alt="Profile" />
      </div>
      <div className="profile-info">
        <h4>{userProgress.name}</h4>
        <p>Level {userProgress.level}</p>
      </div>
      <button className="view-profile-btn" onClick={handleViewProfile}>View Profile</button>
    </div>
  );
};

export default ProfileCard;
