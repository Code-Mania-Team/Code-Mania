import React, { useState } from "react";
import useAuth  from "../hooks/useAxios.js";
import { login } from "../services/login"; // your axiosPublic login function
import { Link } from "react-router-dom";
import swordImage from "../assets/sword.png";
import shieldImage from "../assets/shield.png";
import showPasswordIcon from "../assets/view.png";
import hidePasswordIcon from "../assets/hide.png";
import styles from "../styles/SignInModal.module.css";

// OAuth button component
const OAuthButton = ({ isLoading, onClick, icon, text }) => (
  <button
    type="button"
    className={styles.oauthButton}
    onClick={onClick}
    disabled={isLoading}
  >
    <div className={styles.oauthIcon}>{icon}</div>
    {text}
  </button>
);

// Google icon SVG
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
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  if (!isOpen) return null;

  // Validate password
  const validatePassword = (pass) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    if (pass.length < minLength) return "Password must be at least 8 characters long";
    if (!hasUpperCase) return "Password must contain at least one uppercase letter";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter";
    if (!hasNumbers) return "Password must contain at least one number";
    if (!hasSpecialChar) return "Password must contain at least one special character";
    return "";
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (isSignUpMode) {
      setPasswordError(validatePassword(newPassword));
      if (confirmPassword && newPassword !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);

    if (newConfirmPassword && password !== newConfirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleBackToEmailPassword = () => {
    setShowOtpField(false);
    setOtp("");
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUpMode) {
        // SIGN UP + OTP logic (same as before)
        if (!showOtpField) {
          if (password !== confirmPassword) {
            setIsLoading(false);
            return;
          }
          // TODO: API call to request OTP
          setShowOtpField(true);
        } else {
          // TODO: API call to verify OTP
          onSignInSuccess({ email });
        }
      } else {
        // LOGIN flow
        const authData = await login(email, password); // <-- call login API
        setAuth(authData); // store accessToken + user
        console.log("Login successful, authData:", authData);
        onSignInSuccess(authData);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.signinModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeModal} onClick={onClose}>
          &times;
        </button>

        <div className={styles.welcomeSection}>
          <img
            src={swordImage}
            alt="Sword"
            className={`${styles.pixelIcon} ${styles.pixelSword}`}
          />
          <h2>{isSignUpMode ? "Create your account" : "Welcome, Adventurer!"}</h2>
          <img
            src={shieldImage}
            alt="Shield"
            className={`${styles.pixelIcon} ${styles.pixelShield}`}
          />
        </div>

        <p className={styles.subtext}>
          {isSignUpMode
            ? "Start your adventure in Code Mania"
            : "Sign in to continue your journey"}
        </p>

        <div className={styles.oauthButtons}>
          <OAuthButton
            isLoading={isLoading}
            onClick={() => console.log("Google OAuth clicked")}
            icon={<GoogleIcon />}
            text="Continue with Google"
          />
        </div>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.signinForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">{isSignUpMode ? "Email" : "Email"}</label>
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

          <div className={styles.formGroup}>
            <label htmlFor="password">{isSignUpMode ? "Password" : "Password"}</label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
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

          {isSignUpMode && (
            <div className={styles.formGroup}>
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePasswordButton}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
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
          )}

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
              <p className={styles.otpNote}>
                We've sent a 6-digit OTP to your email
              </p>
            </div>
          )}

          <button type="submit" className={styles.signinButton} disabled={isLoading}>
            {isLoading
              ? showOtpField
                ? "Verifying..."
                : "Processing..."
              : showOtpField
              ? "Verify OTP"
              : isSignUpMode
              ? "Send Verification Code"
              : "Continue"}
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
            {isSignUpMode ? "Already have an account? " : "Don't have an account yet? "}
            <button
              type="button"
              className={styles.signupLinkButton}
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setShowOtpField(false);
                setOtp("");
              }}
            >
              {isSignUpMode ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignInModal;
