import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/SignInModal.module.css';

const swordImage = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925752/sword_cnrdam.png';
const shieldImage = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925752/shield_ykk5ek.png';
const showPasswordIcon = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/view_yj1elw.png';
const hidePasswordIcon = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925754/hide_apyeec.png';

const OAuthButton = ({ isLoading, onClick, icon, text }) => (
  <button 
    type="button" 
    className={styles.oauthButton}
    onClick={onClick}
    disabled={isLoading}
  >
    <div className={styles.oauthIcon}>
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false); // used for SIGN UP only
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  const validatePassword = (pass) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    if (pass.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (isSignUpMode) {
      setPasswordError(validatePassword(newPassword));
      if (confirmPassword && newPassword !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    if (newConfirmPassword && password !== newConfirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(''); // Clear previous login errors
    
    try {
      if (isSignUpMode) {
        // SIGN UP flow with OTP
        if (!showOtpField) {
          // Step 1: validate password + confirm and request OTP
          if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            setIsLoading(false);
            return;
          }
          const passwordError = validatePassword(password);
          if (passwordError) {
            setPasswordError(passwordError);
            setIsLoading(false);
            return;
          }
          // TODO: Replace with your actual API call to send OTP
          // await api.requestSignupOtp({ email, password });
          setShowOtpField(true);
        } else {
          // Step 2: verify OTP and finish sign up
          // const user = await api.verifySignupOtp({ email, otp });
          onSignInSuccess(true);
          return; // Exit early after successful signup
        }
      } else {
        // LOGIN flow: simple email + password (no OTP)
        
        // Basic validation
        if (!email || !password) {
          setLoginError('Please enter both email and password');
          setIsLoading(false);
          return;
        }
        
        // TODO: Replace with your actual API call
        // const user = await api.login({ email, password });
        
        // For now, allow any login (reverted to original behavior)
        onSignInSuccess(false);
        return;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setLoginError('An error occurred during sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }

    e.stopPropagation();
    return false;
  };

  const handleBackToEmailPassword = () => {
    setShowOtpField(false);
    setOtp('');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.signinModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeModal} onClick={onClose}>&times;</button>

        <div className={styles.welcomeSection}>
          <img src={swordImage} alt="Sword" className={`${styles.pixelIcon} ${styles.pixelSword}`} />
          <h2>{isSignUpMode ? 'Create your account' : 'Welcome, Adventurer!'}</h2>
          <img src={shieldImage} alt="Shield" className={`${styles.pixelIcon} ${styles.pixelShield}`} />
        </div>

        <p className={styles.subtext}>
          {isSignUpMode ? 'Start your adventure in Code Mania' : 'Sign in to continue your journey'}
        </p>

        {/* Google OAuth Button */}
        <div className={styles.oauthButtons}>
          <OAuthButton
            isLoading={isLoading}
            onClick={() => console.log('Google OAuth clicked')}
            icon={<GoogleIcon />}
            text="Continue with Google"
          />
        </div>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        {!isSignUpMode ? (
          <>

            <form onSubmit={handleSubmit} className={styles.signinForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLoginError(''); // Clear error when user types
                  }}
                  placeholder="you@example.com"
                  required
                  disabled={showOtpField}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.passwordInputContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      handlePasswordChange(e);
                      setLoginError(''); // Clear error when user types
                    }}
                    placeholder="Enter your password"
                    required
                    className={styles.passwordInput}
                  />
                  <button 
                    type="button" 
                    className={styles.togglePasswordButton}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword(!showPassword);
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <img 
                      src={showPassword ? hidePasswordIcon : showPasswordIcon} 
                      alt=""
                      className={styles.togglePasswordIcon}
                    />
                  </button>
                </div>
                {passwordError && !showOtpField && (
                  <p className={styles.errorText}>{passwordError}</p>
                )}
              </div>

              <div className={styles.rememberMe}>
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

              <button type="submit" className={styles.signinButton} disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Continue'}
              </button>

              {loginError && (
                <p className={styles.errorText}>{loginError}</p>
              )}


              <p className={styles.signupHint}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  className={styles.signupLinkButton}
                  onClick={() => {
                    setIsSignUpMode(true);
                    setShowOtpField(false);
                    setOtp('');
                    setLoginError(''); // Clear error when switching modes
                  }}
                >
                  Create one
                </button>
              </p>
            </form>
          </>
        ) : (
          <>

            <form onSubmit={handleSubmit} className={styles.signinForm}>
              <div className={styles.formGroup}>
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

              <div className={styles.formGroup}>
                <label htmlFor="signup-password">Password</label>
                <div className={styles.passwordInputContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signup-password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Choose a password"
                    required
                    className={styles.passwordInput}
                  />
                  <button 
                    type="button" 
                    className={styles.togglePasswordButton}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword(!showPassword);
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <img 
                      src={showPassword ? hidePasswordIcon : showPasswordIcon} 
                      alt=""
                      className={styles.togglePasswordIcon}
                    />
                  </button>
                </div>
                {passwordError && !showOtpField && (
                  <p className={styles.errorText}>{passwordError}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className={styles.passwordInputContainer}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm your password"
                    required={isSignUpMode}
                    className={styles.passwordInput}
                  />
                  <button 
                    type="button" 
                    className={styles.togglePasswordButton}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <img 
                      src={showConfirmPassword ? hidePasswordIcon : showPasswordIcon} 
                      alt="" 
                      className={styles.togglePasswordIcon}
                    />
                  </button>
                </div>
                {passwordError && !showOtpField && (
                  <p className={styles.errorText}>{passwordError}</p>
                )}
              </div>

              {showOtpField && (
                <div className={styles.formGroup}>
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
                  <p className={styles.otpNote}>We've sent a 6-digit OTP to your email</p>
                </div>
              )}

              <button type="submit" className={styles.signinButton} disabled={isLoading}>
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
                  className={styles.backButton}
                  onClick={handleBackToEmailPassword}
                  disabled={isLoading}
                >
                  Back to email & password
                </button>
              )}


              <p className={styles.signupHint}>
                Already have an account?{' '}
                <button
                  type="button"
                  className={styles.signupLinkButton}
                  onClick={() => {
                    setIsSignUpMode(false);
                    setShowOtpField(false);
                    setOtp('');
                    setLoginError(''); // Clear error when switching modes
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
