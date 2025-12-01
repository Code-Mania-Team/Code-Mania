import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import "../App.css";
import crown from "../assets/crown.png";
import profileIcon from "../assets/profile-icon.png";


const Header = ({ isAuthenticated, onOpenModal, onSignOut }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSignOut = (e) => {
    e.stopPropagation();
    localStorage.clear();   // clears everything
    onSignOut();
    navigate('/');
    
  };
  return (
    <header className="header">
      <div className="logo">
        <img src={crown} alt="Code Mania Logo" />
        <h1 className="logo-text"><NavLink to="/">Code Mania</NavLink></h1>
      </div>

      <nav className="nav">
        <NavLink to="/" className="nav-link">HOME</NavLink>

        <div className="nav-dropdown">
          <NavLink to="/learn" className="nav-link">LEARN</NavLink>
          <div className="dropdown-menu">
            <Link to="/learn/python" className="dropdown-item">Python</Link>
            <Link to="/learn/cpp" className="dropdown-item">C++</Link>
            <Link to="/learn/javascript" className="dropdown-item">JavaScript</Link>
          </div>
        </div>

        <NavLink to="/community" className="nav-link">COMMUNITY</NavLink>
        <NavLink to="/leaderboard" className="nav-link">LEADERBOARD</NavLink>

        {isAuthenticated ? (
          <div className="profile-icon-container" onClick={handleProfileClick}>
            <div className="profile-icon">
              <span role="img" aria-label="Profile">👤</span>
            </div>
            
            <div className="profile-dropdown">
              <button className="dropdown-item" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button className="sign-in-btn" onClick={onOpenModal}>
            Sign In
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
