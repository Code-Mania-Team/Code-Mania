import { useState } from 'react';
import { Code, Play, Twitter, Youtube, Frog } from 'lucide-react';
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
            <h1 className="hero-title">LEARN TO CODE</h1>
            <p className="hero-description">Master programming with interactive courses and hands-on projects. Build real-world applications while learning.</p>
            <button className="get-started-btn">Start Learning</button>
          </div>
        </section>

        {/* Practice Section */}
        <section className="practice-section">
          <div className="practice-container">
            <div className="practice-card left">
              <div className="badge">Challenges</div>
              <Frog className="card-icon" size={48} />
              <h3>Practice your coding</h3>
              <p>challenges with projects designed to apply what you've learned</p>
            </div>
            <div className="practice-card right">
              <div className="badge">Apply</div>
              <h3>Apply what you've learned</h3>
              <p>to real-world projects</p>
            </div>
          </div>
        </section>

        {/* Featured Languages Section */}
        <section className="featured-languages">
          <h2 className="section-title">Featured Languages</h2>
          <div className="languages-grid">
            {/* Python */}
            <div className="language-card">
              <div className="language-image">
                <img src="/python.gif" alt="Python" className="language-img" />
              </div>
              <h4>Python</h4>
              <p className="language-description">Versatile and beginner-friendly</p>
            </div>

            {/* C++ */}
            <div className="language-card">
              <div className="language-image">
                <img src="/c++.gif" alt="C++" className="language-img" />
              </div>
              <h4>C++</h4>
              <p className="language-description">High-performance programming</p>
            </div>

            {/* JavaScript */}
            <div className="language-card">
              <div className="language-image">
                <img src="/javascript.gif" alt="JavaScript" className="language-img" />
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
            <button className="explore-btn">Start Coding Now</button>
          </div>
          <div className="learn-image">
            <img src="/learntocode.gif" className="learn-gif" alt="Learn to Code" />
          </div>
        </div>
      </section>

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