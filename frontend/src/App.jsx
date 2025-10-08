import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Code, Play, Twitter, Youtube } from 'lucide-react';
import './App.css';
import Header from "./components/header";
import Footer from "./components/footer";
import Community from "./pages/Community";
import Leaderboard from "./pages/Leaderboard";

const Home = () => (
  <>
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">LEARN TO CODE</h1>
        <p className="hero-description">Master programming with interactive courses and hands-on projects. Build real-world applications while learning.</p>
        <button className="get-started-btn">Get Started</button>
      </div>
    </section>

    <section className="featured-languages">
      <h2 className="section-title">Featured Languages</h2>
      <div className="languages-grid">
        <div className="language-card">
          <div className="language-image">
            <img src="/src/assets/python.gif" alt="Python" className="language-img" />
          </div>
          <h4>Python</h4>
          <p className="language-description">Versatile and beginner-friendly</p>
        </div>

        <div className="language-card">
          <div className="language-image">
            <img src="/src/assets/c++.gif" alt="C++" className="language-img" />
          </div>
          <h4>C++</h4>
          <p className="language-description">High-performance programming</p>
        </div>

        <div className="language-card">
          <div className="language-image">
            <img src="/src/assets/javascript.gif" alt="JavaScript" className="language-img" />
          </div>
          <h4>JavaScript</h4>
          <p className="language-description">Web development powerhouse</p>
        </div>
      </div>
    </section>

    <section className="learn-section">
      <div className="learn-content">
        <div className="learn-text">
          <h2>Start Your Coding Quest</h2>
          <p>Embark on an epic journey where programming is your weapon. Complete challenges, unlock new skills, and level up as you build real projects.</p>
        </div>
        <div className="learn-image">
          <img src="/src/assets/learntocode.gif" alt="Learn to code"/>
        </div>
      </div>

      <div className="learn-content">
        <div className='learn-text'>
          <h2>Level Up Your Skills</h2>
          <p>Coding is your next adventure. Master quests, earn achievements, and progress from beginner to pro while creating powerful applications.</p>
        </div>
        <div className="learn-image">
          <img src="/src/assets/chill.gif" alt="Learn to code"/>
        </div>
      </div>

      <div className="learn-content">
        <div className="learn-text">
          <h2>Play. Code. Conquer.</h2>
          <p>Turn coding into your next big win. Face challenges, build real-world projects, and climb the leaderboard of your own success.</p>
        </div>
        <div className="learn-image">
          <img src="/src/assets/117.gif" alt="Learn to code"/>
        </div>
      </div>
    </section>
  </>
);

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
              <Route path="/community" element={<Community />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;