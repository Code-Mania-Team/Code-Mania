import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import "../App.css";

import characterIcon0 from '/assets/characters/icons/character.png';
import characterIcon1 from '/assets/characters/icons/character1.png';
import characterIcon2 from '/assets/characters/icons/character3.png';

const crown = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/crown_rgkcpl.png';
const burgerIcon = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925752/burger_fhgxqr.png';

const Header = ({ isAuthenticated, onOpenModal, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [characterIcon, setCharacterIcon] = useState(null);
  const navigate = useNavigate();

  // Load character icon from localStorage
  useEffect(() => {
    const iconByCharacterId = {
      0: characterIcon0,
      1: characterIcon1,
      2: characterIcon2,
    };

    const loadCharacterIcon = () => {
      const storedIcon = localStorage.getItem('selectedCharacterIcon');
      if (storedIcon) {
        setCharacterIcon(storedIcon);
        return;
      }

      const storedCharacterIdRaw = localStorage.getItem('selectedCharacter');
      const storedCharacterId = storedCharacterIdRaw === null ? null : Number(storedCharacterIdRaw);
      if (storedCharacterId === null || Number.isNaN(storedCharacterId)) {
        setCharacterIcon(null);
        return;
      }

      const fallbackIcon = iconByCharacterId[storedCharacterId] || null;
      if (fallbackIcon) {
        localStorage.setItem('selectedCharacterIcon', fallbackIcon);
      }
      setCharacterIcon(fallbackIcon);
    };

    // Load immediately
    loadCharacterIcon();

    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'selectedCharacterIcon' || e.key === 'selectedCharacter') {
        loadCharacterIcon();
      }
    };

    // Also listen for custom events (for same-tab updates)
    const handleCharacterUpdate = () => {
      loadCharacterIcon();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('characterUpdated', handleCharacterUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('characterUpdated', handleCharacterUpdate);
    };
  }, []);

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
        <h1 className="logo-text"><NavLink to={homePath} onClick={() => setIsMenuOpen(false)}>Code Mania</NavLink></h1>
      </div>

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
              {characterIcon ? (
                <img 
                  src={characterIcon} 
                  alt="Profile" 
                  className="profile-character-icon"
                />
              ) : (
                <span role="img" aria-label="Profile">👤</span>
              )}
            </div>
          </div>
        ) : (
          <button className="sign-in-btn" onClick={() => { onOpenModal(); setIsMenuOpen(false); }}>
            Sign In
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;