import React from 'react';
import '../styles/Aboutpage.css';
const laptopImg = "https://res.cloudinary.com/daegpuoss/image/upload/v1770949053/laptop1_ejnkeg.png";

const About = () => {
  return (
    <div className="about-page">                                                  
        <section className="about-section">
            <div className="about-image">
                <img src={laptopImg} alt="Laptop Graphic" />
            </div>
            <div className="about-text">
                <div className="skills">Level Up Your Coding Game</div>
                <h1>THE MOST FUN WAY TO LEVEL UP YOUR CODE</h1>
                <p>CodeMania is more than just a tutorial site; it transforms debugging into leveling up. Journey through Python, C++, and JavaScript.</p>
                <div className="ascii-art">(ˆ ◡ ˆ) ✧</div>
            </div>
        </section>
        <section className="info-container">
        <div className="info-box">
          <div className='codemania'>
            <h3>🚀 WHY CODE MANIA?</h3>
            </div>
          <ul>
            <li><strong>Engagement First:</strong> Interactive challenges.</li>
            <li><strong>Built for Freshmen:</strong> Learn by playing.</li>
            <li><strong>Learn by Doing:</strong> Write real code.</li>
          </ul>
        </div>
      </section>     
      <section className="dev-section">
        <div className="dev-header">
          <h2>CODE MANIA DEVELOPER</h2>
          <p>Computer Science at College of Mary Immaculate Inc</p>
        </div>
        <div className='developer'>
            <div class="card">
               <div className="img"></div>
                <div className="dev-info">
                    <h2 className='dev-name'>Bodino, John Paul</h2>
                    <h3 className="dev-pos">Backend Developer</h3>
                </div>
            </div>
            <div class="card">
               <div className="img"></div>
                <div className="dev-info">
                    <h2 className='dev-name'>Bodino, John Paul</h2>
                    <h3 className="dev-pos">Backend Developer</h3>
                </div>
            </div>
            <div class="card">
               <div className="img"></div>
                <div className="dev-info">
                    <h2 className='dev-name'>Bodino, John Paul</h2>
                    <h3 className="dev-pos">Backend Developer</h3>
                </div>
            </div>
            <div class="card">
               <div className="img"></div>
                <div className="dev-info">
                    <h2 className='dev-name'>Bodino, John Paul</h2>
                    <h3 className="dev-pos">Backend Developer</h3>
                </div>
            </div>
            <div class="card">
               <div className="img"></div>
                <div className="dev-info">
                    <h2 className='dev-name'>Bodino, John Paul</h2>
                    <h3 className="dev-pos">Backend Developer</h3>
                </div>
            </div>
            
            
        </div>
        
        
      </section>
               

    </div>
  );
};

export default About;
