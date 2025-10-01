import React from 'react';
import "../App.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="thesis-info">
            <h3>Code Mania</h3>
            <p>An interactive learning platform for programming education</p>
          </div>
          
          <div className="team-members">
            <h4>Developers</h4>
            <div className="members-grid">
              <div className="member">Jet Padilla</div>
              <div className="member">Diether Pano</div>
              <div className="member">Genniesys Bracia</div>
              <div className="member">John Paul Bodino</div>
              <div className="member">Wilster Dela Cruz</div>
            </div>
          </div>
          
          <div className="academic-info">
            <p>© {currentYear} Code Mania. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;