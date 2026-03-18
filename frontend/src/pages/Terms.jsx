import React from "react";
import "../styles/LegalPages.css";

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-wrap">
        <h1>Terms and Conditions</h1>
        <p className="legal-muted">Last updated: March 18, 2026</p>

        <h2>1. Overview</h2>
        <p>
          Code Mania is a learning game. By creating an account or using the service, you agree to these Terms.
        </p>

        <h2>2. Accounts</h2>
        <p>
          Keep your account secure. You are responsible for activity under your account.
        </p>

        <h2>3. Gameplay and Rewards</h2>
        <p>
          XP, cosmetics, and rewards are for fun and may change as we improve the game.
        </p>

        <h2>4. Community</h2>
        <p>
          Be respectful. We may remove content or restrict accounts for abuse or spam.
        </p>

        <h2>5. Contact</h2>
        <p>
          If you have questions about these Terms, contact the Code Mania team.
        </p>
      </div>
    </div>
  );
}
