import React from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ currentLesson = 1, totalLessons = 12, title = '⚙️ Setting up' }) => {
  const progressPercentage = (currentLesson / totalLessons) * 100;

  return (
    <div className={styles['lesson-progress']}>
      <h2 className={styles['lesson-stage']}>{title}</h2>
      <div className={styles['progress-bar']}>
        <div
          className={styles['progress-fill']}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className={styles['progress-text']}>Lesson {currentLesson} of {totalLessons}</p>
    </div>
  );
};

export default ProgressBar;
