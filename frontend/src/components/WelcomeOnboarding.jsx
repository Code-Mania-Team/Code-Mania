import React, { useState, useEffect } from 'react';
import styles from '../styles/WelcomeOnboarding.module.css';
import char1Preview from '/assets/characters/Char1/Animation/walkdown_ch1.png';
import char2Preview from '/assets/characters/Char2/Animation/walkdown_ch2.png';
import char3Preview from '/assets/characters/Char3/Animation/walkdown_ch3.png';
import char4Preview from '/assets/characters/Char4/Animation/walkdown_ch4.png';
import characterIcon from '/assets/characters/icons/character.png';
import characterIcon1 from '/assets/characters/icons/character1.png';
import characterIcon3 from '/assets/characters/icons/character3.png';
import characterIcon4 from '/assets/characters/icons/character4.png'
import { useOnBoardUsername } from '../services/setUsername';

const WelcomeOnboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(0);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const onBoardUsername = useOnBoardUsername();

  // Character options (you can add more character sprites here)
  const characters = [
    { id: 0, name: 'Nova', sprite: char1Preview, icon: characterIcon1, color: '#ff6b6b' },
    { id: 1, name: 'Echo', sprite: char2Preview, icon: characterIcon, color: '#4ecdc4' },
    { id: 2, name: 'Flux', sprite: char3Preview, icon: characterIcon3, color: '#95e1d3' },
    { id: 3, name: 'Zephyr', sprite: char4Preview, icon: characterIcon4, color: '#8aa6ff' },
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

  const handleContinue =  async (e) => {
    e.preventDefault();
    // Validate username on step 1
    if (currentStep === 1) {
      if (!username.trim()) {
        setUsernameError('Please enter a username');
        return;
      }
      // if (username.length < 3) {
      //   setUsernameError('Username must be at least 3 characters');
      //   return;
      // }
      // // In a real app, check if username is taken
      // // For now, simulate a check
      // if (username.toLowerCase() === 'was') {
      //   setUsernameError('Username is already taken :(');
      //   return;
      // }
      try {
        // Save to backend
        const res = await onBoardUsername(username, characters[selectedCharacter].id);
        console.log("onBoardUsername response:", res);
        if (res.success) {
          localStorage.setItem("username", username);
          localStorage.setItem("needsUsername", "false");
          localStorage.setItem('selectedCharacter', characters[selectedCharacter].id);
          localStorage.setItem('selectedCharacterIcon', characters[selectedCharacter].icon);

          window.dispatchEvent(new CustomEvent('characterUpdated', {
            detail: { characterIcon: characters[selectedCharacter].icon }
          }));
            
        }

      } catch (error) {
        setUsernameError("Username already taken or invalid");
        return;
      }
      setUsernameError('');
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save user preferences
      localStorage.setItem('selectedCharacter', characters[selectedCharacter].id);
      localStorage.setItem('selectedCharacterIcon', characters[selectedCharacter].icon);
      localStorage.setItem('username', username);
      
      // Dispatch custom event to notify header component
      window.dispatchEvent(new CustomEvent('characterUpdated', {
        detail: { characterIcon: characters[selectedCharacter].icon }
      }));
      
      onComplete();
    }
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
        </div>

        {/* Computer Mascot with Speech Bubble */}
        <div className={styles.mascotSection}>
          <div className={styles.mascot}>
            <img 
              src="https://res.cloudinary.com/daegpuoss/image/upload/v1767930117/COMPUTER_cejwzd.png" 
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
                  <div style={{
                    width: '128px',
                    height: '128px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={characters[selectedCharacter].sprite}
                      className={styles.spriteImage}
                      style={{
                        transform: 'translateX(-128px)'
                      }}
                    />
                  </div>
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
                  <div style={{
                    width: '128px',
                    height: '128px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={characters[selectedCharacter].sprite}
                      className={styles.spriteImage}
                      style={{
                        transform: 'translateX(-128px)'
                      }}
                    />
                  </div>
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
                  <div style={{
                    width: '128px',
                    height: '128px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={characters[selectedCharacter].sprite}
                      className={styles.spriteImage}
                      style={{
                        transform: 'translateX(-128px)'
                      }}
                    />
                  </div>
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