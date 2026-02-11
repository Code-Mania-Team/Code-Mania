// components/AuthLoadingOverlay.jsx
import React from "react";
import "../styles/AuthLoadingOverlay.css";

const AuthLoadingOverlay = () => {
  return (
    <div className="auth-loading-overlay">
      <div className="auth-loading-box">
        <div className="spinner"></div>
        <p>Loading your adventure...</p>
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;
