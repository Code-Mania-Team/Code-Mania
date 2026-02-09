import React from 'react';
import { NavLink, Link, useNavigate } from "react-router-dom";
import laptoperror from '../assets/pageerror.png';

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