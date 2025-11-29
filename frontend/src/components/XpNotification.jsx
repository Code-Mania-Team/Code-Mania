import React from "react";
import styles from "../styles/XpNotification.module.css";

const XpNotification = ({ show, onClose, onNext }) => {
  if (!show) return null;

  return (
    <div className={styles["xp-panel"]}>
      <div className={styles["xp-card-primary"]}>
        <div className={styles["xp-title-row"]}>
          <span className={styles["xp-icon"]}>✦</span>
          <span className={styles["xp-title"]}>+100 XP</span>
        </div>
        <p className={styles["xp-text"]}>
          You earned XP for this exercise. Keep it up!
        </p>
      </div>

      <div className={styles["xp-card-secondary"]}>
        <div className={styles["xp-title-row"]}>
          <span className={styles["xp-icon-confetti"]}>🎉</span>
          <span className={styles["xp-title"]}>You got it!</span>
        </div>
        <div className={styles["xp-footer-row"]}>
          <p className={styles["xp-text"]}>Press "Next" to continue.</p>
          <button
            className={styles["xp-next-btn"]}
            onClick={onNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default XpNotification;
