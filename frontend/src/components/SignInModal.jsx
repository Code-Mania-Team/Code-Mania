import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import swordImage from '../assets/sword.png';
import shieldImage from '../assets/shield.png';
import '../App.css';
import { signUp } from '../service/signup.js';



const SignInModal = ({ isOpen, onClose, onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
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
    setLoading(true);
    setMessage('');

    try {
      await signUp(email);
      console.log('Sign-in email sent to:', email);
      setMessage(`Magic link sent to ${email}! Check your inbox.`);
      onSignInSuccess && onSignInSuccess()

      }catch (error) {
        console.error('Error during sign-in:', error);}
    console.log('Signing in with:', { email, password, rememberMe });
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

              {!showOtpField ? (
                <>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', margin: '10px 0' }}>
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ marginRight: '8px', width: '16px', height: '16px' }}
                    />
                    <label 
                      htmlFor="rememberMe"
                      style={{ margin: 0, cursor: 'pointer', fontSize: '14px' }}
                    >
                      Remember me
                    </label>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label htmlFor="otp">Enter OTP</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter the 6-digit OTP"
                    required
                    maxLength="6"
                  />
                  <p className="otp-note">We've sent a 6-digit OTP to your email</p>
                </div>
              )}

              <button type="submit" className="signin-button" disabled={isLoading}>
                {isLoading ? 'Processing...' : showOtpField ? 'Verify OTP' : 'Continue'}
              </button>

              {showOtpField && (
                <button 
                  type="button" 
                  className="back-button"
                  onClick={handleBackToEmailPassword}
                  disabled={isLoading}
                >
                  Back to email & password
                </button>
              )}
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