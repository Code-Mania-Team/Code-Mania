import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import "../App.css";

const crown = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/crown_rgkcpl.png';
const burgerIcon = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925752/burger_fhgxqr.png';

const Header = ({ isAuthenticated, onOpenModal, onSignOut, hideNav }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const homePath = isAuthenticated ? '/dashboard' : '/';

  const handleProfileClick = () => {
    navigate('/profile');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
  <header className="header">
    <div className="logo">
      <NavLink to={homePath} onClick={() => setIsMenuOpen(false)}>
        <img src={crown} alt="Code Mania Logo" />
      </NavLink>
      <h1 className="logo-text">
        <NavLink to={homePath} onClick={() => setIsMenuOpen(false)}>
          Code Mania
        </NavLink>
      </h1>
    </div>

    {!hideNav && (
      <>
        <button 
          className="hamburger" 
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <img 
            src={burgerIcon} 
            alt="Menu" 
            className={`hamburger-icon ${isMenuOpen ? 'is-active' : ''}`} 
          />
        </button>

        <nav className={`nav ${isMenuOpen ? 'is-active' : ''}`}>
          <NavLink to={homePath} className="nav-link" onClick={() => setIsMenuOpen(false)}>HOME</NavLink>

          <div className="nav-dropdown">
            <NavLink to="/learn" className="nav-link" onClick={() => setIsMenuOpen(false)}>LEARN</NavLink>
            <div className="dropdown-menu">
              <Link to="/learn/python" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Python</Link>
              <Link to="/learn/cpp" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>C++</Link>
              <Link to="/learn/javascript" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>JavaScript</Link>
            </div>
          </div>

          <NavLink to="/freedomwall" className="nav-link" onClick={() => setIsMenuOpen(false)}>FREEDOM WALL</NavLink>
          <NavLink to="/leaderboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>LEADERBOARD</NavLink>

          {isAuthenticated ? (
            <div className="profile-icon-container" onClick={handleProfileClick}>
              <div className="profile-icon">
                <span role="img" aria-label="Profile">👤</span>
              </div>
            </div>
          ) : (
            <button className="sign-in-btn" onClick={() => { onOpenModal(); setIsMenuOpen(false); }}>
              Sign In
            </button>
          )}
        </nav>
      </>
    )}
  </header>
);
};

export default Header;