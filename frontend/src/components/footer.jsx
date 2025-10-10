import React from 'react';
import { Instagram, Twitter, Github, Youtube, Linkedin } from 'lucide-react';
import crown from "../assets/crown.png";
import "../App.css";

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
                <li><a href="#about">About</a></li>
                <li><a href="#community">Community</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-columns">

            <div className="footer-column">
              <h4>LEARN</h4>
              <ul>
                <li><a href="/learn/python">Python</a></li>
                <li><a href="/learn/javascript">JavaScript</a></li>
                <li><a href="/learn/cpp">C++</a></li>
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
            <span>© {currentYear} Code Mania. All rights reserved.</span>
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