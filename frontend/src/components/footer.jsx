import React from 'react';
import { NavLink } from 'react-router-dom';
import { Instagram, Twitter, Github, Youtube, Linkedin } from 'lucide-react';
import "../App.css";

const crown = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/crown_rgkcpl.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={crown} alt="Code Mania" />
              <span>Code Mania</span>
            </div>
            <div className="footer-company">
              <h4>COMPANY</h4>
              <ul>
                <li><NavLink to="/about">About</NavLink></li>
                <li><NavLink to="/community">Community</NavLink></li>
              </ul>
            </div>
          </div>

          <div className="footer-columns">

            <div className="footer-column">
              <h4>LEARN</h4>
              <ul>
                <li><a href="/learn/python">Python</a></li>
                <li><a href="/learn/cpp">C++</a></li>
                <li><a href="/learn/javascript">JavaScript</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>TEAM</h4>
              <ul>
                <li>Jet Padilla</li>
                <li>Diether Pano</li>
                <li>Genniesys Bracia</li>
                <li>John Paul Bodino</li>
                <li>Wilster Dela Cruz</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-legal">
            <span>© 2025 Code Mania. All rights reserved.</span>
          </div>
          
          <div className="footer-socials">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;