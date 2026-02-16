import React from 'react';
import styles from '../styles/ProgressBar.module.css';

const ProgressBar = ({ currentLesson = 1, totalLessons = 4, title = '⚙️ Setting up', variant = 'full' }) => {
  const progressPercentage = (currentLesson / totalLessons) * 100;

  return (
    <div className={styles['lesson-progress']}>
      <h2 className={styles['lesson-stage']}>{title}</h2>
      {variant === 'full' && (
        <>
          <div className={styles['progress-bar']}>
            <div
              className={styles['progress-fill']}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className={styles['progress-text']}>Exercise {currentLesson} of {totalLessons}</p>
        </>
      )}
    </div>
  );
};

export default ProgressBar;
