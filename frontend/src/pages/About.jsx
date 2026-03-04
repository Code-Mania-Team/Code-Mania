import React from 'react';
import '../styles/Aboutpage.css';

const About = () => {
  return (
    <div className="about-page">                                                  
        <section className="about-section">
            <div className="about-image">
              <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1772617659/laptop1_ejnkeg_s1xyt3.png" alt="Laptop Graphic" />
            </div>
            <div className="about-text">
                <h1>THE MOST FUN WAY TO BUILD CODING SKILLS</h1>
                <p>CodeMania is more than just a tutorial site; it turns debugging and problem-solving into an interactive learning journey across Python, C++, and JavaScript.</p>
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
          <h2>CODE MANIA DEVELOPERS</h2>
          <p>Computer Science at College of Mary Immaculate Inc</p>
        </div>
        <div className='developer'>
            <div className="dev-card-wrap">
              <div className="card">
                <div className="img"><img src="https://res.cloudinary.com/daegpuoss/image/upload/v1772633637/3_g2jeys.jpg" alt="Developer" /></div>
                <div className="dev-info">
                  <h2 className='dev-name dev-name-jet'>Padilla, Jet</h2>
                  <h3 className="dev-pos">Project Manager & Frontend Engineer</h3>
                </div>
              </div>
              <div className="dev-links dev-links-below">
                <a href="#" className="dev-link" aria-label="Padilla, Jet LinkedIn"><img src="/assets/linkedin.png" alt="LinkedIn" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Padilla, Jet GitHub"><img src="/assets/github.jpg" alt="GitHub" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Padilla, Jet Gmail"><img src="/assets/gmail.jpg" alt="Gmail" className="dev-link-icon" /></a>
              </div>
            </div>

            <div className="dev-card-wrap">
              <div className="card">
                <div className="img"><img src="https://res.cloudinary.com/daegpuoss/image/upload/v1772633637/4_y29bfi.png" alt="Developer" /></div>
                <div className="dev-info">
                  <h2 className='dev-name dev-name-diether'>Pano, Diether</h2>
                  <h3 className="dev-pos">Fullstack Developer & Head Operations</h3>
                </div>
              </div>
              <div className="dev-links dev-links-below">
                <a href="#" className="dev-link" aria-label="Pano, Diether LinkedIn"><img src="/assets/linkedin.png" alt="LinkedIn" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Pano, Diether GitHub"><img src="/assets/github.jpg" alt="GitHub" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Pano, Diether Gmail"><img src="/assets/gmail.jpg" alt="Gmail" className="dev-link-icon" /></a>
              </div>
            </div>

            <div className="dev-card-wrap">
              <div className="card">
                <div className="img"><img src="https://res.cloudinary.com/daegpuoss/image/upload/v1772637355/641757866_893181560280167_8755260566288583584_n_pqxwxa.png" alt="Developer" /></div>
                <div className="dev-info">
                  <h2 className='dev-name dev-name-jp'>Bodino, John Paul</h2>
                  <h3 className="dev-pos">Backend Developer</h3>
                </div>
              </div>
              <div className="dev-links dev-links-below">
                <a href="#" className="dev-link" aria-label="Bodino, John Paul LinkedIn"><img src="/assets/linkedin.png" alt="LinkedIn" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Bodino, John Paul GitHub"><img src="/assets/github.jpg" alt="GitHub" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Bodino, John Paul Gmail"><img src="/assets/gmail.jpg" alt="Gmail" className="dev-link-icon" /></a>
              </div>
            </div>

            <div className="dev-card-wrap">
              <div className="card">
                <div className="img"><img src="https://res.cloudinary.com/daegpuoss/image/upload/v1772633637/5_g0q1gc.jpg" alt="Developer" /></div>
                <div className="dev-info">
                  <h2 className='dev-name dev-name-wilster'>Dela Cruz, Wilster</h2>
                  <h3 className="dev-pos">Backend Engineer</h3>
                </div>
              </div>
              <div className="dev-links dev-links-below">
                <a href="#" className="dev-link" aria-label="Dela Cruz, Wilster LinkedIn"><img src="/assets/linkedin.png" alt="LinkedIn" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Dela Cruz, Wilster GitHub"><img src="/assets/github.jpg" alt="GitHub" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Dela Cruz, Wilster Gmail"><img src="/assets/gmail.jpg" alt="Gmail" className="dev-link-icon" /></a>
              </div>
            </div>

            <div className="dev-card-wrap">
              <div className="card">
                <div className="img"><img src="https://res.cloudinary.com/daegpuoss/image/upload/v1772633638/6_pyig7k.png" alt="Developer" /></div>
                <div className="dev-info">
                  <h2 className='dev-name dev-name-gennie'>Bracia, Genniesys</h2>
                  <h3 className="dev-pos">UI/UX Designer & Product Designer</h3>
                </div>
              </div>
              <div className="dev-links dev-links-below">
                <a href="#" className="dev-link" aria-label="Bracia, Genniesys LinkedIn"><img src="/assets/linkedin.png" alt="LinkedIn" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Bracia, Genniesys Gmail"><img src="/assets/gmail.jpg" alt="Gmail" className="dev-link-icon" /></a>
                <a href="#" className="dev-link" aria-label="Bracia, Genniesys GitHub"><img src="/assets/github.jpg" alt="GitHub" className="dev-link-icon" /></a>
              </div>
            </div>

            <div className="dev-card-wrap">
              <div className="card">
                <div className="img"><img src="https://res.cloudinary.com/daegpuoss/image/upload/v1772633637/2_hrn8ia.jpg" alt="Developer" /></div>
                <div className="dev-info">
                  <h2 className='dev-name dev-name-mascot'>Team Pet</h2>
                </div>
              </div>
            </div>
        </div>
        
        
      </section>
               

    </div>
  );
};

export default About;
