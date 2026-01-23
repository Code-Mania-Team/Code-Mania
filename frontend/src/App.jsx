import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Link } from "react-router-dom";
import "./App.css";
import Header from "./components/header";
import Footer from "./components/footer";
import FreedomWall from "./pages/FreedomWall";
import Leaderboard from "./pages/Leaderboard";
import Learn from "./pages/Learn";
import PythonCourse from "./pages/PythonCourse";
import PythonExercise from "./pages/PythonExercise";
import CppCourse from "./pages/CppCourse";
import CppExercise from "./pages/CppExercise";
import JavaScriptCourse from "./pages/JavaScriptCourse";
import JavaScriptExercise from "./pages/JavaScriptExercise";
import SignInModal from "./components/SignInModal";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import WelcomeOnboarding from "./components/WelcomeOnboarding";
import About from "./pages/About";

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
};

// Home page
const Home = () => (
  <>
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">LEARN TO CODE</h1>
        <p className="hero-description">
          Master programming with interactive courses and hands-on projects.
          Build real-world applications while learning.
        </p>
        <Link to="/learn" className="get-started-btn">Get Started</Link>
      </div>
    </section>

    <section className="featured-languages">
      <h2 className="section-title">Featured Languages</h2>
      <div className="languages-grid">
        <Link to="/learn/python" className="language-card-link">
          <div className="language-card">
            <div className="language-image">
              <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1766925755/python_mcc7yl.gif" alt="Python" className="language-img" />
            </div>
            <h4>Python</h4>
            <p className="language-description">Versatile and beginner-friendly</p>
          </div>
        </Link>

        <Link to="/learn/cpp" className="language-card-link">
          <div className="language-card">
            <div className="language-image">
              <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/c_atz4sx.gif" alt="C++" className="language-img" />
            </div>
            <h4>C++</h4>
            <p className="language-description">High-performance programming</p>
          </div>
        </Link>

        <Link to="/learn/javascript" className="language-card-link">
          <div className="language-card">
            <div className="language-image">
              <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1766925754/javascript_esc21m.gif" alt="JavaScript" className="language-img" />
            </div>
            <h4>JavaScript</h4>
            <p className="language-description">Web development powerhouse</p>
          </div>
        </Link>
      </div>
    </section>

    <section className="learn-section">
      <div className="learn-content">
        <div className="learn-text">
          <h2>Start Your Coding Quest</h2>
          <p>
            Embark on an epic journey where programming is your weapon.
            Complete challenges, unlock new skills, and level up as you build
            real projects.
          </p>
        </div>
        <div className="learn-image">
          <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1766925761/learntocode_yhnfkd.gif" alt="Learn to code" />
        </div>
      </div>

      <div className="learn-content">
        <div className="learn-text">
          <h2>Level Up Your Skills</h2>
          <p>
            Coding is your next adventure. Master quests, earn achievements,
            and progress from beginner to pro while creating powerful
            applications.
          </p>
        </div>
        <div className="learn-image">
          <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/chill_jnydvb.gif" alt="Chill coding" />
        </div>
      </div>

      <div className="learn-content">
        <div className="learn-text">
          <h2>Play. Code. Conquer.</h2>
          <p>
            Turn coding into your next big win. Face challenges, build
            real-world projects, and climb the leaderboard of your own success.
          </p>
        </div>
        <div className="learn-image">
          <img src="https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/117_jycate.gif" alt="Coding challenge" />
        </div>
      </div>
    </section>
  </>
);

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Update localStorage when isAuthenticated changes
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  // hide header/footer on exercise routes and dashboard
  const hideGlobalHeaderFooter = 
    location.pathname.startsWith("/learn/python/exercise") || 
    location.pathname.startsWith("/learn/cpp/exercise") ||
    location.pathname.startsWith("/learn/javascript/exercise") ||
    location.pathname === "/dashboard";

  // hide only footer on freedom wall
  const hideFooterOnly = location.pathname === "/freedomwall";

  return (
    <div className="app">
      {!hideGlobalHeaderFooter && (
        <Header 
          isAuthenticated={isAuthenticated}
          onOpenModal={() => setIsModalOpen(true)}
          onSignOut={() => setIsAuthenticated(false)}
        />
      )}
      <ScrollToTop />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/python" element={<PythonCourse />} />
          <Route 
            path="/learn/python/exercise/:exerciseId" 
            element={
              <PythonExercise 
                isAuthenticated={isAuthenticated}
                onOpenModal={() => setIsModalOpen(true)}
                onSignOut={() => setIsAuthenticated(false)}
              />
            } 
          />
          <Route path="/learn/cpp" element={<CppCourse />} />
          <Route path="/learn/cpp/exercise/:exerciseId" element={<CppExercise />} />
          <Route path="/learn/cpp/exercise/:moduleId/:exerciseId" element={<CppExercise />} />
          <Route path="/learn/javascript" element={<JavaScriptCourse />} />
          <Route path="/learn/javascript/exercise/:exerciseId" element={<JavaScriptExercise />} />
          <Route path="/freedomwall" element={<FreedomWall />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile onSignOut={() => setIsAuthenticated(false)} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/About" element={<About />} />

        </Routes>
      </main>

      {!hideGlobalHeaderFooter && !hideFooterOnly && <Footer />}

      <SignInModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSignInSuccess={(isNew) => {
          setIsAuthenticated(true);
          setIsModalOpen(false);
          if (isNew) {
            setIsNewUser(true);
            navigate('/welcome');
          } else {
            navigate('/dashboard');
          }
        }}
      />
      
      {isAuthenticated && isNewUser && (
        <Routes>
          <Route 
            path="/welcome" 
            element={
              <WelcomeOnboarding 
                onComplete={() => {
                  setIsNewUser(false);
                  localStorage.setItem('hasCompletedOnboarding', 'true');
                  navigate('/dashboard');
                }} 
              />
            } 
          />
        </Routes>
      )}
    </div>
  );
}

// Wrap in Router
export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}