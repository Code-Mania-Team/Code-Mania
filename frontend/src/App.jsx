import { useState } from 'react';
import { Code, Play, Twitter, Youtube } from 'lucide-react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <h1>Code Mania</h1>
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
            <h1 className="hero-title">
              Level Up 
              Your Coding Skills, Play,
              Learn, and Master Programming!
            </h1>
            <button className="get-started-btn">
              Get Started
            </button>
          </div>
        </section>

        {/* Learn Section */}
        <section className="learn-section">
          <div className="learn-content">
            <div className="learn-text">
              <h2>Learn to Code</h2>
              <p>Master programming with our interactive courses and hands-on projects. Build real-world applications while learning.</p>
              <button className="explore-btn">Explore Courses</button>
            </div>
            <div className="learn-image">
              <img src="/underground.jpg" alt="Learn to code" />
            </div>
          </div>
        </section>

        {/* Featured Languages Section */}
        <section className="featured-languages">
          <h2 className="section-title">Featured Languages</h2>
          <div className="languages-grid">
            {/* Python */}
            <div className="language-card">
              <div className="language-icon python-icon">
                <span>PY</span>
              </div>
              <h4>Python</h4>
              <p className="language-description">Versatile and beginner-friendly</p>
            </div>

            {/* C++ */}
            <div className="language-card">
              <div className="language-icon cpp-icon">
                <span>C++</span>
              </div>
              <h4>C++</h4>
              <p className="language-description">High-performance programming</p>
            </div>

            {/* JavaScript */}
            <div className="language-card">
              <div className="language-icon js-icon">
                <span>JS</span>
              </div>
              <h4>JavaScript</h4>
              <p className="language-description">Web development powerhouse</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="socials">
              <h4>SOCIALS</h4>
              <div className="social-icons">
                <div className="social-icon discord">
                  <span>D</span>
                </div>
                <div className="social-icon facebook">
                  <span>F</span>
                </div>
                <div className="social-icon twitter">
                  <Twitter className="social-icon-svg" />
                </div>
                <div className="social-icon youtube">
                  <Youtube className="social-icon-svg" />
                </div>
              </div>
            </div>
            
            <div className="company">
              <h4>COMPANY</h4>
              <div className="company-links">
                <p><a href="#" className="footer-link">About Us</a></p>
                <p><a href="#" className="footer-link">Terms of Use</a></p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;