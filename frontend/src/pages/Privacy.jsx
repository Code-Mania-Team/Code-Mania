import React from "react";
import "../styles/LegalPages.css";

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-wrap">
        <h1>Privacy Policy</h1>
        <p className="legal-muted">Last updated: March 18, 2026</p>

        <h2>1. What we collect</h2>
        <p>
          We collect account info (like email) and gameplay progress (like XP, quiz/exam attempts) to run the game.
        </p>

        <h2>2. How we use it</h2>
        <p>
          We use data to provide features, save progress, prevent abuse, and improve the experience.
        </p>

        <h2>3. Sharing</h2>
        <p>
          We do not sell personal data. Some data may be visible in public profiles and leaderboards.
        </p>

        <h2>4. Contact</h2>
        <p>
          If you have questions about this policy, contact the Code Mania team.
        </p>
      </div>
    </div>
  );
}
