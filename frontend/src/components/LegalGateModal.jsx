import React, { useMemo, useState } from "react";
import styles from "../styles/LegalGateModal.module.css";

export default function LegalGateModal({ isOpen, busy, onAccept, errorMessage }) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const canContinue = useMemo(() => acceptTerms && acceptPrivacy && !busy, [acceptTerms, acceptPrivacy, busy]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Terms and Privacy">
      <div className={styles.modal}>
        <div className={styles.title}>Welcome to Code Mania</div>
        <div className={styles.sub}>
          Before you continue, please review and accept our Terms and Privacy Policy.
        </div>

        <div className={styles.scroll} aria-label="Terms and Privacy text">
          <div className={styles.docTitle}>Terms and Conditions</div>

          <div className={styles.docHeading}>1. Overview</div>
          <p className={styles.docP}>
            Code Mania is a learning game. By creating an account or using the service, you agree to these Terms.
          </p>

          <div className={styles.docHeading}>2. Accounts</div>
          <p className={styles.docP}>
            Keep your account secure. You are responsible for activity under your account.
          </p>

          <div className={styles.docHeading}>3. Gameplay and Rewards</div>
          <p className={styles.docP}>
            XP, cosmetics, and rewards are for fun and may change as we improve the game.
          </p>

          <div className={styles.docHeading}>4. Community</div>
          <p className={styles.docP}>
            Be respectful. We may remove content or restrict accounts for abuse or spam.
          </p>

          <div className={styles.docHeading}>5. Contact</div>
          <p className={styles.docP}>
            If you have questions about these Terms, contact the Code Mania team.
          </p>

          <div className={styles.docDivider} />

          <div className={styles.docTitle}>Privacy Policy</div>

          <div className={styles.docHeading}>1. What we collect</div>
          <p className={styles.docP}>
            We collect account info (like email) and gameplay progress (like XP, quiz/exam attempts) to run the game.
          </p>

          <div className={styles.docHeading}>2. How we use it</div>
          <p className={styles.docP}>
            We use data to provide features, save progress, prevent abuse, and improve the experience.
          </p>

          <div className={styles.docHeading}>3. Sharing</div>
          <p className={styles.docP}>
            We do not sell personal data. Some data may be visible in public profiles and leaderboards.
          </p>

          <div className={styles.docHeading}>4. Contact</div>
          <p className={styles.docP} style={{ marginBottom: 0 }}>
            If you have questions about this policy, contact the Code Mania team.
          </p>
        </div>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(Boolean(e.target.checked))}
          />
          <span>I agree to the Terms and Conditions</span>
        </label>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(Boolean(e.target.checked))}
          />
          <span>I agree to the Privacy Policy</span>
        </label>

        {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}

        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!canContinue}
          onClick={() => onAccept?.()}
        >
          {busy ? "Saving..." : "I Agree & Continue"}
        </button>
      </div>
    </div>
  );
}
