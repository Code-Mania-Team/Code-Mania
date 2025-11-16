import React, { useState, useEffect } from 'react';
import styles from '../styles/WelcomeOnboarding.module.css';
import idleSheet from '../assets/aseprites/Idle-Sheet.png';

const WelcomeOnboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(0);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // Character options (you can add more character sprites here)
  const characters = [
    { id: 0, name: 'Character 1', sprite: idleSheet, color: '#ff6b6b' },
    { id: 1, name: 'Character 2', sprite: idleSheet, color: '#4ecdc4' },
    { id: 2, name: 'Character 3', sprite: idleSheet, color: '#95e1d3' },
  ];

  const steps = [
    {
      type: 'character-selection',
      message: "First, let's choose your look. You can switch this up later, too.",
      progress: 33
    },
    {
      type: 'username-input',
      message: "Looking good! What should I call you?",
      progress: 66
    },
    {
      type: 'welcome',
      message: "Nice to meet you {username}. Now let's find something to learn!",
      progress: 100
    }
  ];

  useEffect(() => {
    // Animate progress bar
    const timer = setTimeout(() => {
      setProgress(steps[currentStep].progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleContinue = () => {
    // Validate username on step 1
    if (currentStep === 1) {
      if (!username.trim()) {
        setUsernameError('Please enter a username');
        return;
      }
      if (username.length < 3) {
        setUsernameError('Username must be at least 3 characters');
        return;
      }
      // In a real app, check if username is taken
      // For now, simulate a check
      if (username.toLowerCase() === 'was') {
        setUsernameError('Username is already taken :(');
        return;
      }
      setUsernameError('');
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save user preferences
      localStorage.setItem('selectedCharacter', selectedCharacter);
      localStorage.setItem('username', username);
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setUsernameError('');
    }
  };

  const handleCharacterChange = (direction) => {
    if (direction === 'next') {
      setSelectedCharacter((prev) => (prev + 1) % characters.length);
    } else {
      setSelectedCharacter((prev) => (prev - 1 + characters.length) % characters.length);
    }
  };

  const getMessage = () => {
    let message = steps[currentStep].message;
    if (currentStep === 2 && username) {
      message = message.replace('{username}', username);
    }
    return message;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <button 
            className={styles.backButton} 
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            ←
          </button>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <button className={styles.skipButton} onClick={handleSkip}>
            Skip
          </button>
        </div>

        {/* Computer Mascot with Speech Bubble */}
        <div className={styles.mascotSection}>
          <div className={styles.mascot}>
            <img 
              src="/src/assets/COMPUTER.png" 
              alt="Computer Mascot" 
              className={styles.computerImage}
            />
          </div>
          <div className={styles.speechBubble}>
            <div className={styles.speechArrow}></div>
            <p>{getMessage()}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={styles.mainContent}>
          {/* Character Selection */}
          {currentStep === 0 && (
            <div className={styles.characterSelection}>
              <button 
                className={styles.arrowButton}
                onClick={() => handleCharacterChange('prev')}
              >
                ‹
              </button>
              <div className={styles.characterDisplay}>
                <div className={styles.characterSprite}>
                  <img 
                    src={characters[selectedCharacter].sprite} 
                    alt="Character"
                    className={styles.spriteImage}
                  />
                </div>
                <div className={styles.characterShadow}></div>
              </div>
              <button 
                className={styles.arrowButton}
                onClick={() => handleCharacterChange('next')}
              >
                ›
              </button>
            </div>
          )}

          {/* Username Input */}
          {currentStep === 1 && (
            <div className={styles.usernameSection}>
              <div className={styles.characterDisplay}>
                <div className={styles.characterSprite}>
                  <img 
                    src={characters[selectedCharacter].sprite} 
                    alt="Character"
                    className={styles.spriteImage}
                  />
                </div>
                <div className={styles.characterShadow}></div>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={`${styles.usernameInput} ${usernameError ? styles.error : ''}`}
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError('');
                  }}
                  maxLength={20}
                  autoFocus
                />
                {usernameError && (
                  <div className={styles.errorMessage}>
                    <span className={styles.errorIcon}>⚠</span>
                    {usernameError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Final Welcome */}
          {currentStep === 2 && (
            <div className={styles.welcomeSection}>
              <div className={styles.characterDisplay}>
                <div className={styles.characterSprite}>
                  <img 
                    src={characters[selectedCharacter].sprite} 
                    alt="Character"
                    className={styles.spriteImage}
                  />
                </div>
                <div className={styles.characterShadow}></div>
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button className={styles.continueButton} onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default WelcomeOnboarding;