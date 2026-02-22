import React from "react";
import styles from "../styles/StageCompleteModal.module.css";

const StageCompleteModal = ({
  show,
  stageNumber = 1,
  languageLabel = "",
  badgeSrc,
  onContinue,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h1
            className={styles.title}
            style={{
              color:
                languageLabel === "C++"
                  ? "#3b82f6"
                  : languageLabel === "JavaScript"
                    ? "#eab308"
                    : languageLabel === "Python"
                      ? "#10b981"
                      : "#fbbf24",
            }}
          >
            Stage {stageNumber} complete!
          </h1>
          <p className={styles.subtitle}>
            Great work. Take a quick breather—then continue to the next stage.
          </p>
        </div>

        {badgeSrc && (
          <div className={styles.badgeWrap}>
            <img
              src={badgeSrc}
              alt={`${languageLabel} stage ${stageNumber} badge`}
              className={styles.badge}
            />
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.continueBtn}
            onClick={onContinue}
          >
            Continue
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageCompleteModal;
