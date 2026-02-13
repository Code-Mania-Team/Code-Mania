import React from 'react';
import { NavLink, Link, useNavigate } from "react-router-dom";
const laptoperror = "https://res.cloudinary.com/daegpuoss/image/upload/v1770949052/pageerror_mpkl4b.png";

import '../styles/PageNotFound.css';

const PageNotFound = () => {
  return (
    <div className='pagenotFound'>
        <section className="notfound">
        <div className='errorlaptop-image'>
            <img src={laptoperror} alt="Laptop Graphic" />
        </div>
        <div className='error-mess'>
            <h1>Oops!</h1>
            <p>We couldn’t find the page you were looking for</p>
            <div className="backhome-btn">
                <a><Link to="/" className="backhome-link">Go back home</Link></a>
            </div>

            </div>
        </section>
    </div>
  );
};

export default PageNotFound;