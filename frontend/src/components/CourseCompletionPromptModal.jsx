import React, { useEffect, useState } from "react";
import styles from "../styles/CourseCompletionPromptModal.module.css";

const CourseCompletionPromptModal = ({
  show,
  languageLabel = "",
  title,
  subtitle,
  badgeImage,
  badgeAlt,
  badgeLabel,
  primaryLabel = "Take Exam",
  onTakeExam,
  secondaryLabel = "Take Quizzes First",
  onSecondary,
  feedbackLabel,
  onFeedback,
  showTerminalCta = false,
  terminalCtaLabel = "Try Out Our Terminal!",
  onTerminalCta,
  showClose = true,
  closeLabel = "Later",
  onClose,  
}) => {
  const [terminalUnlocked, setTerminalUnlocked] = useState(false);

  useEffect(() => {
    if (show) setTerminalUnlocked(false);
  }, [show]);

  if (!show) return null;

  const resolvedTitle = title || "Story completed!";
  const resolvedSubtitle =
    subtitle ||
    `You finished the ${languageLabel} exercises. What do you want to do next?`;

  const handleTerminalClick = () => {
    if (!terminalUnlocked) {
      setTerminalUnlocked(true);
      return;
    }

    onTerminalCta?.();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h1 className={styles.title}>{resolvedTitle}</h1>
          <p className={styles.subtitle}>{resolvedSubtitle}</p>

          {badgeImage && (
            <div className={styles.badgePreview}>
              <img
                src={badgeImage}
                alt={badgeAlt || badgeLabel || "Stage badge"}
                className={styles.badgePreviewImage}
              />
              {badgeLabel && <p className={styles.badgePreviewText}>{badgeLabel}</p>}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onTakeExam}
          >
            {primaryLabel}
          </button>
          {secondaryLabel && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          )}
          {feedbackLabel && onFeedback && (
            <button
              type="button"
              className={styles.feedbackBtn}
              onClick={onFeedback}
            >
              {feedbackLabel}
            </button>
          )}
          {showTerminalCta && onTerminalCta && (
            <button
              type="button"
              className={`${styles.terminalBtn} ${terminalUnlocked ? styles.terminalBtnUnlocked : ""}`}
              onClick={handleTerminalClick}
              aria-label={terminalUnlocked ? terminalCtaLabel : "Unlock Terminal Access"}
            >
              {terminalUnlocked ? terminalCtaLabel : "Locked Terminal - Tap to Unlock"}
            </button>
          )}
          {showClose && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
            >
              {closeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCompletionPromptModal;
