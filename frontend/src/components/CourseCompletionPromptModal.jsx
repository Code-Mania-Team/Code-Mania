import React from "react";
import styles from "../styles/CourseCompletionPromptModal.module.css";

const CourseCompletionPromptModal = ({
  show,
  languageLabel = "",
  onTakeExam,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h1 className={styles.title}>Course completed!</h1>
          <p className={styles.subtitle}>
            You finished the {languageLabel} exercises. What do you want to do next?
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onTakeExam}
          >
            Take Exam
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => window.location.href = '/learn/javascript'}
          >
            Take Quizzes First
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCompletionPromptModal;
