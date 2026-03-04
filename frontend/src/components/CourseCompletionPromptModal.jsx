import React from "react";
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
  showClose = true,
  closeLabel = "Later",
  onClose,  
}) => {
  if (!show) return null;

  const resolvedTitle = title || "Course completed!";
  const resolvedSubtitle =
    subtitle ||
    `You finished the ${languageLabel} exercises. What do you want to do next?`;

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
