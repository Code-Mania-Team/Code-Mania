import React from 'react';
import styles from '../styles/SignInModal.module.css';

const GuestProgressModal = ({ isOpen, onClose, onSignIn }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} style={{ zIndex: 2000 }}>
      <div className={styles.signinModal} onClick={e => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '440px', textAlign: 'center', minHeight: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '0.5rem', fontFamily: '"Press Start 2P", cursive', fontSize: '1rem', lineHeight: '1.4' }}>
          Progress Not Saved!
        </h2>
        <p style={{ color: '#e2e8f0', lineHeight: '1.6', fontSize: '0.95rem', margin: '0' }}>
          You have reached the limit for guest users. Your progress is currently <strong style={{color: '#f87171'}}>not saved</strong>.
        </p>
        <p style={{ marginBottom: '1rem', color: '#94a3b8', lineHeight: '1.6', fontSize: '0.9rem', margin: '0' }}>
          You need to login now to continue your journey and secure your achievements.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button 
            type="button"
            className={styles.backButton}
            onClick={onClose}
            style={{ margin: 0, padding: '0.6rem 1.2rem', width: 'auto' }}
          >
            Not Now
          </button>
          <button 
            type="button"
            className={styles.signinButton}
            onClick={() => { onClose(); onSignIn(); }}
            style={{ margin: 0, padding: '0.6rem 1.2rem', width: 'auto' }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestProgressModal;
