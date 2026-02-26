import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import "../App.css";
import useAuth from "../hooks/useAxios";

// Character icons from Cloudinary
const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';
const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';
const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';
const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';

const crown = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/crown_rgkcpl.png';
const burgerIcon = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925752/burger_fhgxqr.png';

const Header = ({ onOpenModal, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [characterIcon, setCharacterIcon] = useState(null);
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Load character icon from localStorage
  useEffect(() => {
    const iconByCharacterId = {
      0: characterIcon1,
      1: characterIcon0,
      2: characterIcon2,
      3: characterIcon3,
    };

    const loadCharacterIcon = () => {
      const storedCharacterIdRaw = localStorage.getItem('selectedCharacter');
      const storedCharacterId = storedCharacterIdRaw === null ? null : Number(storedCharacterIdRaw);

      if (storedCharacterId === null || Number.isNaN(storedCharacterId)) {
        const userCharacterId = user?.character_id;
        const normalizedUserCharacterId =
          userCharacterId === null || userCharacterId === undefined
            ? null
            : Number(userCharacterId);

        if (normalizedUserCharacterId !== null && !Number.isNaN(normalizedUserCharacterId)) {
          const iconFromUser = iconByCharacterId[normalizedUserCharacterId] || null;
          if (iconFromUser) {
            localStorage.setItem('selectedCharacter', String(normalizedUserCharacterId));
            localStorage.setItem('selectedCharacterIcon', iconFromUser);
            setCharacterIcon(iconFromUser);
            return;
          }
        }

        const storedIcon = localStorage.getItem('selectedCharacterIcon');
        setCharacterIcon(storedIcon || null);
        return;
      }

      const expectedIcon = iconByCharacterId[storedCharacterId] || null;
      if (expectedIcon) {
        localStorage.setItem('selectedCharacterIcon', expectedIcon);
      } else {
        localStorage.removeItem('selectedCharacterIcon');
      }
      setCharacterIcon(expectedIcon);
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
  }, [user?.character_id]);

  const isAdmin = isAuthenticated && user?.role === "admin";
  const homePath = isAdmin ? '/admin' : isAuthenticated ? '/dashboard' : '/';

  const handleProfileClick = () => {
    navigate('/profile');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) {
      setIsLearnOpen(false);
      setIsAccountOpen(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsLearnOpen(false);
    setIsAccountOpen(false);
  };

  const handleLearnClick = (e) => {
    if (window.innerWidth <= 1024) {
      e.preventDefault();
      setIsLearnOpen((prev) => {
        const next = !prev;
        if (next) setIsAccountOpen(false);
        return next;
      });
    } else {
      closeMobileMenu();
    }
  };

  const handleAccountClick = (e) => {
    if (window.innerWidth <= 1024) {
      e.preventDefault();
      setIsAccountOpen((prev) => {
        const next = !prev;
        if (next) setIsLearnOpen(false);
        return next;
      });
    }
  };

  const handleSignOutClick = async () => {
    closeMobileMenu();
    if (onSignOut) await onSignOut();
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
        <NavLink to={homePath} className="nav-link" onClick={closeMobileMenu}>{isAdmin ? "ADMIN" : isAuthenticated ? "DASHBOARD" : "HOME"}</NavLink>

        <div className="nav-dropdown">
          <NavLink to="/learn" className={`nav-link learn-trigger ${isLearnOpen ? "is-open" : ""}`} onClick={handleLearnClick}>
            <span>LEARN</span>
            <span className="learn-arrow">&gt;</span>
          </NavLink>
          <div className={`dropdown-menu ${isLearnOpen ? "is-open" : ""}`}>
            <Link to="/learn" className="dropdown-item" onClick={closeMobileMenu}>All Courses</Link>
            <Link to="/learn/python" className="dropdown-item" onClick={closeMobileMenu}>Python</Link>
            <Link to="/learn/cpp" className="dropdown-item" onClick={closeMobileMenu}>C++</Link>
            <Link to="/learn/javascript" className="dropdown-item" onClick={closeMobileMenu}>JavaScript</Link>
          </div>
        </div>

        <NavLink to="/freedomwall" className="nav-link" onClick={closeMobileMenu}>FREEDOM WALL</NavLink>
        <NavLink to="/leaderboard" className="nav-link" onClick={closeMobileMenu}>LEADERBOARD</NavLink>

        {isLoading ? null : isAuthenticated ?  (
          <>
            <div className="mobile-account nav-dropdown">
              <a href="#" className={`nav-link learn-trigger account-trigger ${isAccountOpen ? "is-open" : ""}`} onClick={handleAccountClick}>
                <span className="account-label">
                  {characterIcon ? (
                    <img src={characterIcon} alt="Profile" className="mobile-account-avatar" />
                  ) : (
                    <span className="mobile-account-avatar-fallback" role="img" aria-label="Profile">👤</span>
                  )}
                  <span>ACCOUNT</span>
                </span>
                <span className="learn-arrow">&gt;</span>
              </a>
              <div className={`dropdown-menu ${isAccountOpen ? "is-open" : ""}`}>
                <Link to="/profile" className="dropdown-item" onClick={closeMobileMenu}>Profile</Link>
                <button type="button" className="dropdown-item dropdown-item-button" onClick={handleSignOutClick}>Sign Out</button>
              </div>
            </div>

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
          </>
        ) : (
          <button className="sign-in-btn" onClick={() => { onOpenModal(); closeMobileMenu(); }}>
            Sign In
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
