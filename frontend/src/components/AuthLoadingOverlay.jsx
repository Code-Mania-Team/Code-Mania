// components/AuthLoadingOverlay.jsx
import React from "react";
import "../styles/AuthLoadingOverlay.css";

const loadinglogo = "https://res.cloudinary.com/daegpuoss/image/upload/v1770949020/loading-logo_dlsmca.gif";

const AuthLoadingOverlay = () => {
  return (
    <div className="auth-loading-overlay">
      <div className="auth-loading-box">
        <img 
          src={loadinglogo} 
          alt="Loading..." 
          className="loading-logo"
        />
        <p>Loading your adventure...</p>
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;
