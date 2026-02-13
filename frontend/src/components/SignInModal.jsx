import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/SignInModal.module.css';
import { signUp } from '../services/signup';  // Import the signUp service
import { verifyOtp } from '../services/verifyOtp';
import { login } from '../services/login';

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
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [showForgotPasswordOtp, setShowForgotPasswordOtp] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');

  const validatePassword = (pass) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?:{}|<>]/.test(pass);

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
          const user = await signUp(email, password);
          setShowOtpField(true);
        } else {
          const user = await verifyOtp(email, otp);
          localStorage.setItem('needsUsername', 'true');
          onSignInSuccess(true);
          onClose();
          return; // Exit early after successful signup
        }
      } else {
        const normalizedEmail = (email || '').trim();
        const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
        if (!normalizedEmail) {
          setLoginError('Please enter your email.');
          setIsLoading(false);
          return;
        }
        if (!emailIsValid) {
          setLoginError('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }
        if (!password) {
          setLoginError('Please enter your password.');
          setIsLoading(false);
          return;
        }

        const user = await login(normalizedEmail, password);

        // Prevent stale avatar from previous account when switching users
        localStorage.removeItem('selectedCharacter');
        localStorage.removeItem('selectedCharacterIcon');

        const normalizedUsername = (user?.username || '').trim();
        const needsOnboarding = !normalizedUsername;

        const characterId = user?.character_id;
        if (characterId !== undefined && characterId !== null) {
          localStorage.setItem('selectedCharacter', String(characterId));
          window.dispatchEvent(new CustomEvent('characterUpdated'));
        } else {
          window.dispatchEvent(new CustomEvent('characterUpdated'));
        }

        if (normalizedUsername) {
          localStorage.setItem('username', normalizedUsername);
          localStorage.setItem('needsUsername', 'false');
          localStorage.setItem('hasSeenOnboarding', 'true');
          localStorage.setItem('hasCompletedOnboarding', 'true');
        } else {
          localStorage.setItem('needsUsername', 'true');
        }

        onSignInSuccess(needsOnboarding);
        onClose();
        return; // Exit early after successful login
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;

      if (backendMessage) {
        setLoginError(String(backendMessage));
      } else {
        setLoginError('An error occurred during sign in. Please try again.');
      }
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

  const handleForgotPassword = () => {
    setIsForgotPasswordMode(true);
    setLoginError('');
  };

  const handleBackToSignIn = () => {
    setIsForgotPasswordMode(false);
    setLoginError('');
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    setResetPasswordError('');

    try {
      // STEP 1: Send OTP
      if (!showForgotPasswordOtp && !showResetPassword) {
        const normalizedEmail = (email || '').trim();
        const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

        if (!normalizedEmail) {
          setLoginError('Please enter your email.');
          setIsLoading(false);
          return;
        }

        if (!emailIsValid) {
          setLoginError('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }

        setForgotPasswordEmail(normalizedEmail);

        // TODO: Call backend to send OTP
        setTimeout(() => {
          setShowForgotPasswordOtp(true);
          setLoginError('OTP sent! Check your email.');
          setIsLoading(false);
        }, 1000);
        return;
      }

      // STEP 2: Verify OTP
      if (showForgotPasswordOtp && !showResetPassword) {
        if (!otp || otp.length !== 6) {
          setLoginError('Please enter a valid 6-digit OTP.');
          setIsLoading(false);
          return;
        }

        // TODO: Verify OTP with backend
        setTimeout(() => {
          setShowResetPassword(true);
          setShowForgotPasswordOtp(false);
          setLoginError('');
          setIsLoading(false);
        }, 1000);
        return;
      }

      // STEP 3: Reset Password
      if (showResetPassword) {
        if (newPassword !== confirmNewPassword) {
          setResetPasswordError('Passwords do not match.');
          setIsLoading(false);
          return;
        }

        const validationError = validatePassword(newPassword);
        if (validationError) {
          setResetPasswordError(validationError);
          setIsLoading(false);
          return;
        }

        // TODO: Call backend reset password API
        console.log('Resetting password for:', forgotPasswordEmail);

        // After success
        setTimeout(() => {
          setShowResetPassword(false);
          setIsForgotPasswordMode(false);
          setNewPassword('');
          setConfirmNewPassword('');
          setOtp('');
          setLoginError('Password successfully reset. You can now sign in.');
          setIsLoading(false);
        }, 1000);
      }

    } catch (error) {
      console.error('Forgot password error:', error);
      setLoginError('Failed to process request. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBackToForgotPasswordEmail = () => {
    setShowForgotPasswordOtp(false);
    setOtp('');
    setLoginError('');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.signinModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeModal} onClick={onClose}>&times;</button>

        <div className={styles.welcomeSection}>
          <img src={swordImage} alt="Sword" className={`${styles.pixelIcon} ${styles.pixelSword}`} />
          <h2>
            {isSignUpMode ? 'Create your account' : 
             isForgotPasswordMode ? 'Reset Password' : 'Welcome, Adventurer!'}
          </h2>
          <img src={shieldImage} alt="Shield" className={`${styles.pixelIcon} ${styles.pixelShield}`} />
        </div>

        <p className={styles.subtext}>
          {isSignUpMode ? 'Start your adventure in Code Mania' : 
           isForgotPasswordMode ? 
             (showResetPassword ? 'Set your new password' :
              showForgotPasswordOtp ? 'Enter the OTP sent to your email' : 'Enter your email to reset password') 
             : 'Sign in to continue your journey'}
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

        {!isSignUpMode && !isForgotPasswordMode ? (
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
                {passwordError && (
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
                <button
                  type="button"
                  className={styles.forgotPasswordButton}
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </p>
            </form>
          </>
        ) : isForgotPasswordMode ? (
          <>

            <form onSubmit={handleForgotPasswordSubmit} className={styles.signinForm}>
              {!showForgotPasswordOtp && !showResetPassword ? (
                // Step 1: Email input
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="forgot-email">Email</label>
                    <input
                      type="email"
                      id="forgot-email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setLoginError(''); // Clear error when user types
                      }}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <button type="submit" className={styles.signinButton} disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </>
              ) : showForgotPasswordOtp && !showResetPassword ? (
                // Step 2: OTP input
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="forgot-otp">Enter OTP</label>
                    <input
                      type="text"
                      id="forgot-otp"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        setLoginError(''); // Clear error when user types
                      }}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      required
                    />
                  </div>

                  <button type="submit" className={styles.signinButton} disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={handleBackToForgotPasswordEmail}
                    disabled={isLoading}
                  >
                    Back to Email
                  </button>
                </>
              ) : null}

              {showResetPassword && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="new-password">New Password</label>
                    <div className={styles.passwordInputContainer}>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setResetPasswordError('');
                        }}
                        placeholder="Enter new password"
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
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="confirm-new-password">Confirm New Password</label>
                    <div className={styles.passwordInputContainer}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirm-new-password"
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          setResetPasswordError('');
                        }}
                        placeholder="Confirm new password"
                        required
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
                  </div>

                  <button type="submit" className={styles.signinButton} disabled={isLoading}>
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>

                  {resetPasswordError && (
                    <p className={styles.errorText}>{resetPasswordError}</p>
                  )}

                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => {
                      setShowResetPassword(false);
                      setShowForgotPasswordOtp(true);
                      setResetPasswordError('');
                    }}
                    disabled={isLoading}
                  >
                    Back to OTP
                  </button>
                </>
              )}

              {loginError && (
                <p className={styles.errorText}>{loginError}</p>
              )}

              {!showForgotPasswordOtp && !showResetPassword ? (
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleBackToSignIn}
                  disabled={isLoading}
                >
                  Back to Sign In
                </button>
              ) : null}
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
                {confirmPasswordError && !showOtpField && (
                  <p className={styles.errorText}>{confirmPasswordError}</p>
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
                    placeholder="Enter 6-digit OTP"
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
