import React from "react";
import { NavLink, Link } from "react-router-dom";
import "../App.css";
import crown from "../assets/crown.png";

const Header = ({ onOpenModal }) => {
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

        <button className="sign-in-btn" onClick={onOpenModal}>
          Sign In
        </button>
      </nav>
    </header>
  );
};

export default Header;
