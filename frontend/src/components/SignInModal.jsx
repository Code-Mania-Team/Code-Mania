import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import swordImage from '../assets/sword.png';
import shieldImage from '../assets/shield.png';
import '../App.css';
import { signInWithEmail } from '../supabaseClient/Auth';



const SignInModal = ({ isOpen, onClose, onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSignInSuccess && onSignInSuccess()
    e.stopPropagation();

    try {
      await signInWithEmail(email);
      console.log('Sign-in email sent to:', email);

      }catch (error) {
        console.error('Error during sign-in:', error);}
    console.log('Signing in with:', { email, password, rememberMe });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>&times;</button>

        <div className="welcome-section">
          <img src={swordImage} alt="Sword" className="pixel-icon pixel-sword" />
          <h2>Welcome, Adventurer!</h2>
          <img src={shieldImage} alt="Shield" className="pixel-icon pixel-shield" />
        </div>

        <p className="subtext">Connect in with Email</p>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <button type="submit" className="signin-button">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default SignInModal;
