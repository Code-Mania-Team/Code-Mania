import React from 'react';
import { Play } from 'lucide-react';
import styles from '../styles/PythonExercise.module.css';

const CodeTerminal = ({ 
  code, 
  onCodeChange, 
  onRun, 
  output, 
  isRunning = false,
  showRunButton = true,
  className = ''
}) => {
  return (
    <div className={`${styles['code-container']} ${className}`}>
      <div className={styles['code-editor']}>
        <div className={styles['editor-header']}>
          <span>script.py</span>
          {showRunButton && (
            <button
              className={`${styles['submit-btn']} ${isRunning ? styles['disabled-btn'] : ''}`}
              onClick={onRun}
              disabled={isRunning}
              title={isRunning ? 'Running...' : 'Run code'}
            >
              <Play size={16} /> {isRunning ? 'Running...' : 'Run'}
            </button>
          )}
        </div>
        <textarea
          className={styles['code-box']}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          disabled={isRunning}
        />
      </div>

      <div className={styles['terminal']}>
        <div className={styles['terminal-header']}>
          Terminal
        </div>
        <div className={styles['terminal-content']}>
          <pre>{output || 'Output will appear here...'}</pre>
        </div>
      </div>
    </div>
  );
};

export default CodeTerminal;
