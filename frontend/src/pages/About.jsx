import React from 'react';
import '../styles/Aboutpage.css'; // Assuming you'll create a CSS file for styling

const About = () => {
  return (
    <div className="about-page">
        <div class="about-section">
            <div className="about-image">
                <div class="skills">Level Up Your Coding Game</div>
                <img src="https://via.placeholder.com/400x250/000/fff?text=Laptop+Graphic" alt="Laptop Graphic"></img>
            </div>
            <div class="about-text">
                <h1>THE MOST FUN WAY TO LEVEL UP YOUR CODE</h1>
                <p>
                    CodeMania is more than just a tutorial site; its transform the frustration of 
                    "debugging" into the thrill of "leveling up." Journey through the digital realms 
                    of Python, C++, and JavaScript. Earn experience points (XP), unlock new logic 
                    gates, and conquer the fundamentals at your own pace. No boring lectures—just 
                    pure, interactive gameplay.
                </p>
                <div class="ascii-art">("ˆ ◡ ˆ") *✧</div>
            </div>
          </div>
        
          <div className="info-container">
              <div className="info-box">
                <h3>🚀 WHY CODEMANIA?</h3>
                <ul>
                    <li><strong>Engagement First:</strong> We turn core programming concepts into interactive challenges to make coding enjoyable.</li>
                    <li><strong>Built for Freshmen:</strong> Specifically designed to help 1st-year students bridge the gap between theory and practice.</li>
                    <li><strong>Learn by Doing:</strong> Progress through levels by writing real code, receiving instant feedback as you play.</li>
                </ul>
              </div>
          </div>

          <div className="dev-section">
              <div class="dev-header">
                <h2>CODE MANIA DEVELOPER</h2>
                <p>Computer Science at College of Mary Immaculate Inc</p>
            </div>
        </div>
      </div>
        
  );
};

export default About;
