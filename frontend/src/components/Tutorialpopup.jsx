import { useEffect, useRef, useState } from "react";
import "../styles/Tutorialpopup.css";

export default function TutorialOverlay({ open, onClose, nextRoute = null }) {
  const sectionsRef = useRef([]);
  const [visibleSections, setVisibleSections] = useState([]);

  useEffect(() => {
    if (!open) return;

    // Emit tutorial open event to pause the game
    window.dispatchEvent(new CustomEvent('code-mania:tutorial-open'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            setVisibleSections((prev) =>
              prev.includes(index) ? prev : [...prev, index]
            );
          }
        });
      },
      { threshold: 0.3 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      observer.disconnect();
      // Emit tutorial close event to resume the game
      window.dispatchEvent(new CustomEvent('code-mania:tutorial-close'));
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-container">
        <div className="tutorial-content">
          <div className="sections-wrapper">
            {/* SECTION 1 */}
            <section
              className={`tutorial-section scroll-section ${
                visibleSections.includes(0) ? "visible" : ""
              }`}
              ref={(el) => (sectionsRef.current[0] = el)}
              data-index="0"
            >
              <div className="section-image">
                <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1770453739/welcome-tutorial_mpega0.png" alt="Welcome Tutorial" />
              </div>

              <div className="section-text">
                <h2>Welcome to Code Mania</h2>
                <p>
                  Welcome to Code Mania! Learn the basics of programming through interactive gameplay. complete quests, and level up your programming skills in this exciting coding adventure.
                </p>
              </div>
            </section>

            {/* SECTION 2 */}
            <section
              className={`tutorial-section scroll-section reversed ${
                visibleSections.includes(1) ? "visible" : ""
              }`}
              ref={(el) => (sectionsRef.current[1] = el)}
              data-index="1"
            >
              <div className="section-image">
                <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1770453737/welcome-controls_cxskmf.png" alt="Character Controls" />
              </div>

              <div className="section-text">
                <h2>Character Controls</h2>
                <p>
                  Use arrow keys <strong>(↑ ↓ ← →)</strong> to move your character around the game world.
                </p>
              </div>
            </section>

            {/* SECTION 3 */}
            <section
              className={`tutorial-section scroll-section ${
                visibleSections.includes(2) ? "visible" : ""
              }`}
              ref={(el) => (sectionsRef.current[2] = el)}
              data-index="2"
            >
              <div className="section-image">
                <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1770453738/welcome-mechanics_a8axyq.png" alt="Game Mechanics" />
              </div>

              <div className="section-text">
                <h2>Game Mechanics</h2>
                <p>
                  Complete coding quests and solve programming puzzles to gain experience points. <strong>"Press E"</strong> to interact with NPCs or Objects and accept quests. Each challenge you solve helps you level up your programming skills and progress through the Code Mania adventure.
                </p>
              </div>
            </section>

            {/* SECTION 4 - NEW */}
            <section
              className={`tutorial-section scroll-section reversed ${
                visibleSections.includes(3) ? "visible" : ""
              }`}
              ref={(el) => (sectionsRef.current[3] = el)}
              data-index="3"
            >
              <div className="section-image">
                <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1773080070/code-terminal_y43ik1.png" alt="Code Editor" />
              </div>

              <div className="section-text">
                <h2>Code Editor Controls</h2>
                <p>
                  Use the <strong>Run button</strong> to test your code and see the output. Use the <strong>Submit button</strong> to validate your solution and complete the quest. Hover over buttons for more information.
                </p>
              </div>
            </section>

            {/* SECTION 5 */}
            <section
              className={`tutorial-section scroll-section ${
                visibleSections.includes(4) ? "visible" : ""
              }`}
              ref={(el) => (sectionsRef.current[4] = el)}
              data-index="4"
            >
              <div className="section-image">
                <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1770578515/welcome-achievement_l6rcbx.png" alt="Advanced Features" />
              </div>

              <div className="section-text">
                <h2>Achievement System</h2>
                <p>
                  Earn <strong>achievement badges</strong> and <strong>experience points</strong> as you master programming concepts and complete challenges. Collect rare badges to showcase your expertise and track your progress. Each badge and XP gain represents a milestone in your coding journey.
                </p>
              </div>
            </section>

            {/* SECTION 6 */}
            <section
              className={`tutorial-section scroll-section reversed ${
                visibleSections.includes(5) ? "visible" : ""
              }`}
              ref={(el) => (sectionsRef.current[5] = el)}
              data-index="5"
            >
              <div className="section-image">
                <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1770575075/welcome-exam_xi8wve.png" alt="Final Exam" />
              </div>

              <div className="section-text">
                <h2>Final Exam</h2>
                <p>
                  Test your programming knowledge in the final exam. Complete all challenges to earn exclusive final exam <strong>badges</strong> and bonus <strong>experience points</strong>. Your final score determines your reward tier and helps you climb up in leaderboard faster.
                </p>
              </div>
            </section>

            {/* SECTION 7 */}
            <section
              className={`tutorial-section scroll-section ${
                visibleSections.includes(6) ? "visible" : ""
              }`}
              ref={(el) => (sectionsRef.current[6] = el)}
              data-index="6"
            >
              <div className="section-image">
                <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1770453720/welcome-leaderboard_lbvloc.jpg" alt="Competition" />
              </div>

              <div className="section-text">
                <h2>Competition</h2>
                <p>
                  Compete with other players on the <strong>global leaderboard</strong> and climb to the ranking system. Participate in coding challenges to prove your skills and earn your place among the top <strong>Code Mania</strong> players worldwide.
                </p>
              </div>
            </section>

            {/* Let's Go Button */}
            <button
              type="button"
              className="lets-go-button"
              onClick={() => onClose?.(nextRoute)}
            >
              Let's Go!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
