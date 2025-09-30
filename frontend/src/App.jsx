import { useState } from 'react';
import { Code, Play, Twitter, Youtube} from 'lucide-react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <h1 className='logo-text'>Code Mania</h1>
        </div>
        <nav className="nav">
          <a href="#" className="nav-link">LEARN</a>
          <a href="#" className="nav-link">COMMUNITY</a>
          <a href="#" className="nav-link">LEADERBOARD</a>
          <button className="sign-in-btn">
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="main-content">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">LEARN TO CODE</h1>
            <p className="hero-description">Master programming with interactive courses and hands-on projects. Build real-world applications while learning.</p>
            <button className="get-started-btn">Start Learning</button>
          </div>
        </section>

        {/* Featured Languages Section */}
        <section className="featured-languages">
          <h2 className="section-title">Featured Languages</h2>
          <div className="languages-grid">
            {/* Python */}
            <div className="language-card">
              <div className="language-image">
                <img src="/src/assets/python.gif" alt="Python" className="language-img" />
              </div>
              <h4>Python</h4>
              <p className="language-description">Versatile and beginner-friendly</p>
            </div>

            {/* C++ */}
            <div className="language-card">
              <div className="language-image">
                <img src="/src/assets/c++.gif" alt="C++" className="language-img" />
              </div>
              <h4>C++</h4>
              <p className="language-description">High-performance programming</p>
            </div>

            {/* JavaScript */}
            <div className="language-card">
              <div className="language-image">
                <img src="/src/assets/javascript.gif" alt="JavaScript" className="language-img" />
              </div>
              <h4>JavaScript</h4>
              <p className="language-description">Web development powerhouse</p>
            </div>
          </div>
        </section>
      </main>

      {/* Learn Section */}
      <section className="learn-section">
        <div className="learn-content">
          <div className="learn-text">
            <h2>Learn to Code</h2>
            <p>Master programming with interactive courses and hands-on projects. Build real-world applications while learning.</p>
          </div>
          <div className="learn-image">
            <img src="/src/assets/learntocode.gif" alt="Learn to code"/>
          </div>
        </div>

        <div className="learn-content">
          <div className='learn-text'>
            <h2>Learn to Code</h2>
            <p>Master programming with interactive courses and hands-on projects. Build real-world applications while learning.</p>
          </div>
          <div className="learn-image">
            <img src="/src/assets/learntocode.gif" alt="Learn to code"/>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <a href="#" className="footer-logo">Code Mania</a>
            
            <div className="socials">
              <h4>SOCIALS</h4>
              <div className="social-icons">
                <a href="#" className="social-icon" aria-label="Discord">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <p className="copyright">© 2024 Code Mania. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;