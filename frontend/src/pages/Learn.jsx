import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import "./Learn.css";

const Learn = () => {
  const navigate = useNavigate();

  const courses = [
    {
      id: 1,
      title: "Python",
      description: "Learn programming fundamentals such as variables, control flow, and loops with the basics of Python.",
      image: "/src/assets/python.gif",
      level: "Beginner",
      color: "#3CB371",
      route: "/learn/python"
    },
    {
      id: 2,
      title: "C++",
      description: "Master high-performance programming with C++. Learn about memory management and system-level coding.",
      image: "/src/assets/c++.gif",
      level: "Beginner",
      color: "#5B8FB9",
      route: "/learn/cpp"
    },
    {
      id: 3,
      title: "JavaScript",
      description: "Begin learning intermediate JavaScript with data structures and modern web development techniques.",
      image: "/src/assets/javascript.gif",
      level: "Beginner",
      color: "#FFD700",
      route: "/learn/javascript"
    }
  ];

  return (
    <div className="learn-page">
      {/* Hero Section with Background Image */}
      <section className="learn-hero">
        <div className="learn-hero-content">
          <p className="learn-hero-subtitle">Discover the universe of</p>
          <h1 className="learn-hero-title">Code Mania</h1>
          <p className="learn-hero-description">
            Begin your programming adventure with hands-on coding challenges. Start learning today for free!
          </p>
        </div>
      </section>

      {/* Courses Section */}
      <section className="courses-section">
        <div className="courses-header">
          <BookOpen className="courses-icon" />
          <h2 className="courses-title">Your Coding Journey Begins</h2>
        </div>
        <p className="courses-subtitle">
          Master programming languages from the ground up. Perfect for beginners looking to build a strong foundation in coding and problem-solving.
        </p>

        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-image-wrapper">
                <img src={course.image} alt={course.title} className="course-image" />
              </div>
              <div className="course-content">
                <div className="course-level">{course.level}</div>
                <h3 className="course-title" style={{ color: course.color }}>
                  {course.title}
                </h3>
                <p className="course-description">{course.description}</p>
                <button 
                  className="course-btn"
                  onClick={() => course.route && navigate(course.route)}
                  disabled={!course.route}
                >
                  Start Learning
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Learn;
