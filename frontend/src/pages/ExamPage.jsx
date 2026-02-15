import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Database, Clock, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import styles from '../styles/Admin.module.css';
import { getExamData } from '../data/examData';

const ExamPage = () => {
  const navigate = useNavigate();

  // Handle exam completion
  const handleExamComplete = (results) => {
    console.log('Exam completed:', results);
    alert(`Exam completed! Grade: ${results.grade}% - ${results.passed ? 'PASSED' : 'FAILED'}`);
    // Navigate back to course
    navigate('/learn/python');
  };

  // Handle exam submission to backend
  const handleExamSubmit = async (examData) => {
    console.log('Submitting exam data:', examData);
    try {
      // Example API call to submit exam results
      const response = await fetch('/api/v1/exam/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(examData)
      });
      
      if (response.ok) {
        console.log('Exam submitted successfully to backend');
      } else {
        console.error('Failed to submit exam');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Final Exam</h1>
          <p className={styles.heroDescription}>
            Test your knowledge with comprehensive exam covering all course topics.
          </p>
        </div>
      </section>

      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <BarChart3 className={styles.icon} />
            <h2 className={styles.title}>Exam Analytics & Statistics</h2>
          </div>
          <button className={styles.button} onClick={() => navigate('/learn/python')}>Back to Course</button>
        </div>

        <p className={styles.subtitle}>Real-time exam performance data and statistical analysis.</p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Total Exams Taken</h3>
            <div className={styles.cardValue}>3</div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Mean Exam Grade</h3>
            <div className={styles.cardValue}>85.3%</div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Median Exam Grade</h3>
            <div className={styles.cardValue}>85.5%</div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Mode Retake Count</h3>
            <div className={styles.cardValue}>0</div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Avg Exam Duration</h3>
            <div className={styles.cardValue}>195 minutes</div>
          </div>
        </div>

        <div className={styles.panels}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Student Exam Performance</h3>
            <p className={styles.panelSubtitle}>Individual student exam results and performance metrics</p>
            <div className={styles.divider}>
              <div className={styles.datasetRow}>
                <div className={styles.datasetLeft}>
                  <div className={styles.datasetName}>student1@example.com</div>
                  <div className={styles.datasetMeta}>
                    PYTHON • Grade: 85.5% • Retakes: 1
                  </div>
                  <div className={styles.datasetMeta} style={{ fontSize: '12px', opacity: 0.7 }}>
                    Started: 2/10/2025 • Completed: 2/10/2025 (255min)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Daily Exam Completions</h3>
            <p className={styles.panelSubtitle}>Exam completion rates and average grades per day</p>
            <div className={styles.divider}>
              <div className={styles.row}>
                <div className={styles.day}>Mon</div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: '50%' }}></div>
                </div>
                <div className={styles.count}>1 exams</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', opacity: 0.7 }}>
                  85.5% avg
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.day}>Tue</div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: '0%' }}></div>
                </div>
                <div className={styles.count}>0 exams</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', opacity: 0.7 }}>
                  0% avg
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.day}>Wed</div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: '0%' }}></div>
                </div>
                <div className={styles.count}>0 exams</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', opacity: 0.7 }}>
                  0% avg
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.day}>Thu</div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: '0%' }}></div>
                </div>
                <div className={styles.count}>0 exams</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', opacity: 0.7 }}>
                  0% avg
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.day}>Fri</div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: '0%' }}></div>
                </div>
                <div className={styles.count}>0 exams</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', opacity: 0.7 }}>
                  0% avg
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.day}>Sat</div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: '0%' }}></div>
                </div>
                <div className={styles.count}>0 exams</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', opacity: 0.7 }}>
                  0% avg
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.day}>Sun</div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: '0%' }}></div>
                </div>
                <div className={styles.count}>0 exams</div>
                <div style={{ marginLeft: '10px', fontSize: '12px', opacity: 0.7 }}>
                  0% avg
                </div>
              </div>
            </div>
          </div>
        </div>
    </main>
    </div>
  );
};

export default ExamPage;
