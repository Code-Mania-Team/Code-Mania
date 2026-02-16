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
      description: "Once the greatest programmer alive, you awaken without memory. Piece by piece, regain your mastery through Python.",
      image: "https://res.cloudinary.com/daegpuoss/image/upload/v1766925755/python_mcc7yl.gif",
      level: "Beginner",
      color: "#3CB371",
      route: "/learn/python"
    },
    {
      id: 2,
      title: "C++",
      description: "Explore the City of C++, where you build structures, control systems, and power the engines that keep the city alive.",
      image: "https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/c_atz4sx.gif",
      level: "Beginner",
      color: "#5B8FB9",
      route: "/learn/cpp"
    },
    {
      id: 3,
      title: "JavaScript",
      description: "In a silent, shifting town, use JavaScript to control events and logic, revealing the hidden forces behind interactive reality.",
      image: "https://res.cloudinary.com/daegpuoss/image/upload/v1766925754/javascript_esc21m.gif",
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
