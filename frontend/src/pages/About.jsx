import React from "react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div style={{ minHeight: "calc(100vh - 70px)", display: "grid", placeItems: "center", background: "#0f172a", color: "#fff", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 680 }}>
        <h1 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "1.4rem", marginBottom: "1rem" }}>ABOUT CODE MANIA</h1>
        <p style={{ fontFamily: "VT323, monospace", fontSize: "1.6rem", lineHeight: 1.35, color: "#cbd5e1", marginBottom: "1.25rem" }}>
          Code Mania turns learning to code into an interactive adventure.
        </p>
        <Link to="/credits" style={{ fontFamily: "'Press Start 2P', cursive", color: "#fbbf24", textDecoration: "none" }}>
          View Asset Credits
        </Link>
      </div>
    </div>
  );
};

export default About;
