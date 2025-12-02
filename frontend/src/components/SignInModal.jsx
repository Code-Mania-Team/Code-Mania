import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import swordImage from '../assets/sword.png';
import shieldImage from '../assets/shield.png';
import '../App.css';
import  {signUp} from '../services/signup';
import  {verifyOtp} from '../services/verifyOtp';
import  {login} from '../services/login';
import { useAuth } from '../context/authProvider';


const OAuthButton = ({ isLoading, onClick, icon, text }) => (
  <button 
    type="button" 
    className="oauth-button"
    onClick={onClick}
    disabled={isLoading}
  >
    <div className="oauth-icon">
      {icon}
    </div>
    {text}
  </button>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path 
      fill="#4285F4" 
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path 
      fill="#34A853" 
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path 
      fill="#FBBC05" 
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path 
      fill="#EA4335" 
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);


const SignInModal = ({ isOpen, onClose, onSignInSuccess }) => {
  // const { isAuthenticated, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false); // used for SIGN UP only
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { refreshProfile } = useAuth();
  


  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUpMode) {
        // SIGN UP flow with OTP
        if (!showOtpField) {
          // Step 1: validate password + confirm and request OTP
          if (password !== confirmPassword) {
            setIsLoading(false);
            return;
          }
            const res = await signUp(email, password); 
            if (res.success)
            setShowOtpField(true);
        } else {
            const res = await verifyOtp(email, otp);
            if (res.token) {
              // localStorage.setItem("token", res.token);
              localStorage.setItem("needsUsername", res.requiresUsername ? "true" : "false");
              await refreshProfile();
              // localStorage.setItem("user_id", res.user_id);
              
            }
            onSignInSuccess(res); 
        }
      } else {
           const res = await login(email, password);
           
          //  console.log(`SIGN IN MODAL REif (res.success === true) {
          //   // localStorage.setItem("token", res.token);
          //   localStorage.setItem("username", res.username); //
          //   localStorage.setItem("needsUsername", res.requiresUsername ? "true" : "false");}
          //   await refreshProfile();  //SPONSE: ${res.success}`)
           if (res.success === true) {
            localStorage.setItem("token", res.token);
            localStorage.setItem("username", res.username); //
            localStorage.setItem("needsUsername", res.requiresUsername ? "true" : "false");
            onSignInSuccess(res); // Temporary for testing
          }
      }
    } catch (err) {
      console.log(`SIGN IN MODAL ERROR: ${err.message}`);
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
          <img src={swordImage} alt="Sword" className="pixel-icon pixel-sword" />
          <h2>{isSignUpMode ? 'Create your account' : 'Welcome, Adventurer!'}</h2>
          <img src={shieldImage} alt="Shield" className="pixel-icon pixel-shield" />
        </div>

        <p className="subtext">
          {isSignUpMode ? 'Start your adventure in Code Mania' : 'Sign in to continue your journey'}
        </p>

        {/* Google OAuth Button */}
        <div className="oauth-buttons">
          <OAuthButton
            isLoading={isLoading}
            onClick={() => console.log('Google OAuth clicked')}
            icon={<GoogleIcon />}
            text="Continue with Google"
          />
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        {!isSignUpMode ? (
          <>

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
                  disabled={showOtpField}
                />
              </div>

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

              <button type="submit" className="signin-button" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Continue'}
              </button>


              <p className="signup-hint">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  className="signup-link-button"
                  onClick={() => {
                    setIsSignUpMode(true);
                    setShowOtpField(false);
                    setOtp('');
                  }}
                >
                  Create one
                </button>
              </p>
            </form>
          </>
        ) : (
          <>

            <form onSubmit={handleSubmit} className="signin-form">
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input
                  type="email"
                  id="signup-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input
                  type="password"
                  id="signup-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="signup-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                />
              </div>

              {showOtpField && (
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
                {isLoading
                  ? showOtpField
                    ? 'Verifying...'
                    : 'Sending code...'
                  : showOtpField
                    ? 'Verify OTP'
                    : 'Send Verification Code'}
              </button>

              {showOtpField && (
                <button
                  type="button"
                  className="back-to-email-button"
                  onClick={handleBackToEmailPassword}
                  disabled={isLoading}
                >
                  Back to email & password
                </button>
              )}


              <p className="signup-hint">
                Already have an account?{' '}
                <button
                  type="button"
                  className="signup-link-button"
                  onClick={() => {
                    setIsSignUpMode(false);
                    setShowOtpField(false);
                    setOtp('');
                  }}
                >
                  Sign in
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};



export default SignInModal;
