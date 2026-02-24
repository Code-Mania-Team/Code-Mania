import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Link, Navigate } from "react-router-dom";
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
import PageNotFound from "./pages/PageNotFound";
import Admin from "./pages/Admin";
import ExerciseManager from "./pages/ExerciseManager";
import CodingExamPage from "./pages/CodingExamPage";
import QuizPage from "./pages/QuizPage";
import useSessionOut, { clearUserSession } from "./services/signOut";
import useAuth from "./hooks/useAxios";
import { axiosPublic } from "./api/axios";
import AuthLoadingOverlay from "./components/AuthLoadingOverlay";
import ProtectedRoute from "./components/protectedRoutes";

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
import axios from 'axios';
// WelcomeOnboarding wrapper component
const WelcomeOnboardingWrapper = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openSignIn) {
      setIsModalOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    // Check if user actually needs onboarding
    if (user?.username) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  // Only show onboarding if user doesn't have username
  if (user.username) {
    return null;
  }

  return <WelcomeOnboarding onComplete={() => {
    navigate('/dashboard');
  }} />;
};

function App() {
  const { isLoading } = useAuth();
  const setCookie = async() => {
    try {
      await axios.get('http://localhost:3000/set-cookies', {
        withCredentials: true
      })
      console.log('Cookies setup successfully.')
    } catch (error) { console.log('Error setting up cookies. ')}
  }
  // setCookie();
  const getCookies = async () => {
    try {
      await axios.get('http://localhost:3000/get-cookies', {
        withCredentials: true
      })
      console.log('Cookies sent to server.')
    } catch (error) { console.log('Error in sending cookies to server.') }
  }
  // getCookies();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated, setIsAuthenticated, setUser } = useAuth();
  const [isNewUser, setIsNewUser] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  

  const SessionOut = useSessionOut();

  useEffect(() => {
    if (location.state?.openSignIn) {
      setIsModalOpen(true);
    }
  }, [location.state]);

  const handleSignOut = async () => {
    try {
      await SessionOut();
    } catch {
      // ignore logout network errors; still clear local session state
    }

    clearUserSession();
    setIsAuthenticated(false);
    setUser(null);
    setIsNewUser(false);
    window.dispatchEvent(new Event('authchange'));
    window.dispatchEvent(new CustomEvent('characterUpdated'));
    navigate('/');
  };

  // Check for Google OAuth callback or login errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    if (error) {
      console.log('OAuth error:', error);
      setIsModalOpen(true);
      return;
    }
    
    if (success === 'true') {
      console.log('OAuth successful');
      // Small delay to ensure cookies are set
      setTimeout(async () => {
        setIsAuthenticated(true);
        setIsModalOpen(false);

        try {
          const res = await axiosPublic.get("/v1/account");
          const profile = res?.data?.data || null;
          setUser(profile);

          if (!profile?.username) {
            navigate('/welcome');
            return;
          }

          navigate('/dashboard');
        } catch {
          navigate('/');
        }
      }, 500);
      return;
    }
  }, [location.search, navigate, setIsAuthenticated, navigate]);

  // hide header/footer on exercise routes, dashboard, exams, and quizzes
  const hideGlobalHeaderFooter = 
    location.pathname.startsWith("/learn/python/exercise") || 
    location.pathname.startsWith("/learn/cpp/exercise") ||
    location.pathname.startsWith("/learn/javascript/exercise") ||
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/quiz") ||
    location.pathname.startsWith("/coding-exam") ||
    location.pathname.startsWith("/exam");

  // hide only footer on freedom wall and PageNotFound
  const hideFooterOnly = location.pathname === "/freedomwall" || 
    !["/", "/learn", "/learn/python", "/learn/cpp", "/learn/javascript", "/freedomwall", "/leaderboard", "/profile", "/dashboard", "/about", "/welcome"].includes(location.pathname);

  return (
    <div className="app">
      {isLoading && <AuthLoadingOverlay />}
      {!hideGlobalHeaderFooter && (
        <Header 
          isAuthenticated={isAuthenticated}
          onOpenModal={() => setIsModalOpen(true)}
          onSignOut={handleSignOut}
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
              <ProtectedRoute onRequireAuth={() => setIsModalOpen(true)}>
                <PythonExercise 
                  isAuthenticated={isAuthenticated}
                  onOpenModal={() => setIsModalOpen(true)}
                  onSignOut={handleSignOut}
                />
              </ProtectedRoute>

            } 
          />
          <Route path="/learn/cpp" element={<CppCourse />} />
          <Route path="/learn/cpp/exercise/:exerciseId" element={<ProtectedRoute>
      <CppExercise />
    </ProtectedRoute>} />
          <Route path="/learn/cpp/exercise/:moduleId/:exerciseId" element={<ProtectedRoute>
      <CppExercise />
    </ProtectedRoute>} />
          <Route path="/learn/javascript" element={<JavaScriptCourse />} />
          <Route path="/learn/javascript/exercise/:exerciseId" element={<ProtectedRoute>
                                                                              <JavaScriptExercise />
                                                                            </ProtectedRoute>
                                                                        } />
          <Route path="/freedomwall" element={<FreedomWall onOpenModal={() => setIsModalOpen(true)} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile onSignOut={handleSignOut} />} />
          <Route path="/dashboard" element={<ProtectedRoute>
      <Dashboard onSignOut={handleSignOut} />
    </ProtectedRoute>} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/exercises/:course" element={<ExerciseManager />} />
          <Route path="/exam/:language/:problemId" element={<ProtectedRoute>
      <CodingExamPage />
    </ProtectedRoute>} />
          <Route path="/quiz/:language/:quizId" element={<ProtectedRoute>
      <QuizPage />
    </ProtectedRoute>} />
          <Route path="/welcome" element={<WelcomeOnboardingWrapper />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </main>

      {!hideGlobalHeaderFooter && !hideFooterOnly && <Footer />}

      <SignInModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSignInSuccess={async (isNew) => {
          setIsAuthenticated(true);
          setIsModalOpen(false);
          setIsNewUser(!!isNew);

          try {
            const res = await axiosPublic.get("/v1/account");
            const profile = res?.data?.data || null;
            setUser(profile);
          } catch {
            setUser(null);
          }

          if (isNew) {
            navigate('/welcome');
            return;
          }
          navigate('/dashboard');
        }}
      />
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