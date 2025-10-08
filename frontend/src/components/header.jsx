// src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../App.css"; // keep styles the same
import crown from "../assets/crown.png";

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <img src={crown} alt="Code Mania Logo" />
        <h1 className="logo-text">Code Mania</h1>
      </div>
      <nav className="nav">
        <Link to="/" className="nav-link">LEARN</Link>
        <Link to="/community" className="nav-link">COMMUNITY</Link>
        <Link to="/leaderboard" className="nav-link">LEADERBOARD</Link>
        <button className="sign-in-btn">
          Sign In
        </button>
      </nav>
    </header>
  );
};

export default Header;
