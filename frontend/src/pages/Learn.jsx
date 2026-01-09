import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import styles from "../styles/Learn.module.css";

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
    <div className={styles.page}>
      {/* Hero Section with Background Image */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroSubtitle}>Discover the universe of</p>
          <h1 className={styles.heroTitle}>Code Mania</h1>
          <p className={styles.heroDescription}>
            Begin your programming adventure with hands-on coding challenges. Start learning today for free!
          </p>
        </div>
      </section>

      {/* Courses Section */}
      <section className={styles.section}>
        <div className={styles.header}>
          <BookOpen className={styles.icon} />
          <h2 className={styles.title}>Your Coding Journey Begins</h2>
        </div>
        <p className={styles.subtitle}>
          Master programming languages from the ground up. Perfect for beginners looking to build a strong foundation in coding and problem-solving.
        </p>

        <div className={styles.grid}>
          {courses.map((course) => (
            <div key={course.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img src={course.image} alt={course.title} className={styles.image} />
              </div>
              <div className={styles.content}>
                <div className={styles.level}>{course.level}</div>
                <h3 className={styles.cardTitle} style={{ color: course.color }}>
                  {course.title}
                </h3>
                <p className={styles.description}>{course.description}</p>
                <button 
                  className={styles.button}
                  onClick={() => {
                    if (!course.route) return;
                    localStorage.setItem('hasTouchedCourse', 'true');
                    localStorage.setItem('lastCourseTitle', course.title);
                    localStorage.setItem('lastCourseRoute', course.route);
                    navigate(course.route);
                  }}
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
