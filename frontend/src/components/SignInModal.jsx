import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import swordImage from '../assets/sword.png';
import shieldImage from '../assets/shield.png';
import '../App.css';
import  {signUp} from '../service/signup';
import  {verifyOtp} from '../service/verifyOtp';

const SignInModal = ({ isOpen, onClose, onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!showOtpField) {
        const res = await signUp(email, password); 
        if (res.success)
          setShowOtpField(true);
      } else {
        const res = await verifyOtp(email, otp); 
        if (res.success)  
          onSignInSuccess({ email });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmailPassword = () => {
    setShowOtpField(false);
    setOtp('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>&times;</button>

        <div className="welcome-section">
          <img src={swordImage} className="pixel-icon pixel-sword" />
          <h2>{showOtpField ? 'Verify OTP' : 'Welcome, Adventurer!'}</h2>
          <img src={shieldImage} className="pixel-icon pixel-shield" />
        </div>

        <p className="subtext">
          {showOtpField
            ? "Enter the code we sent to your email"
            : "Sign in to continue your journey"}
        </p>

        {/* The form is always visible */}
        <form onSubmit={handleSubmit} className="signin-form">

          {/* Email field (always visible) */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={showOtpField}
            />
          </div>

          {/* Switch based on OTP stage */}
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
      </div>
    </div>
  );
};

export default SignInModal;
