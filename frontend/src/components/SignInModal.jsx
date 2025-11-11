import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import swordImage from '../assets/sword.png';
import shieldImage from '../assets/shield.png';
import '../App.css';

const SignInModal = ({ isOpen, onClose, onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(60);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    e.stopPropagation();
    return false;
  };

  const handleResendLink = () => {
    setCountdown(60);
    // Add your resend logic here
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>&times;</button>

        {!isSubmitted ? (
          <>
            <div className="welcome-section">
              <img src={swordImage} alt="Sword" className="pixel-icon pixel-sword" />
              <h2>Welcome, Adventurer!</h2>
              <img src={shieldImage} alt="Shield" className="pixel-icon pixel-shield" />
            </div>

            <p className="subtext">Connect in with Email</p>

            <form onSubmit={handleSubmit} className="signin-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button type="submit" className="signin-button">Submit</button>
            </form>
          </>
        ) : (
          <div className="magic-link-sent">
            <h2 className="magic-link-title">We sent you a magic link</h2>
            
            <p className="magic-link-text">
              To sign in, click on the link we sent to{' '}
              <span className="email-highlight">{email}</span> or{' '}
              <button className="try-different-email" onClick={() => setIsSubmitted(false)}>
                Try a different email
              </button>
            </p>

            <button className="resend-button" onClick={handleResendLink}>
              Resend link {countdown}s
            </button>

            <p className="support-text">
              Having trouble?<br />
              Contact <a href="mailto:support@codemania.games" className="support-link">support@codemania.games</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInModal;
