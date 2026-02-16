import React from 'react';
import { NavLink, Link, useNavigate } from "react-router-dom";
const laptoperror = "https://res.cloudinary.com/daegpuoss/image/upload/v1770949052/pageerror_mpkl4b.png";

import styles from '../styles/PageNotFound.module.css';

const PageNotFound = () => {
  return (
    <div className={styles.pagenotFound}>
        <section className={styles.notFound}>
        <div className={styles.errorLaptopImage}>
            <img src={laptoperror} alt="Laptop Graphic" />
        </div>
        <div className={styles.errorMess}>
            <h1>Oops!</h1>
            <p>We couldn't find the page you were looking for</p>
            <div className={styles.backHomeBtn}>
                <Link to="/" className={styles.backHomeLink}>Go back home</Link>
            </div>

            </div>
        </section>
    </div>
  );
};

export default PageNotFound;