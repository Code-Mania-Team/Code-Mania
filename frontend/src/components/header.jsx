// src/components/Header.jsx
import React from "react";
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
        <a href="#" className="nav-link">LEARN</a>
        <a href="#" className="nav-link">COMMUNITY</a>
        <a href="#" className="nav-link">LEADERBOARD</a>
        <button className="sign-in-btn">
          Sign In
        </button>
      </nav>
    </header>
  );
};

export default Header;
