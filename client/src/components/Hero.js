import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = ({ 
  title, 
  subtitle, 
  backgroundImage, 
  ctaPrimary = 'Schedule a Tour', 
  ctaPrimaryLink = '/contact',
  ctaSecondary,
  ctaSecondaryLink,
  overlay = 0.5,
  size = 'large'
}) => {
  const defaultBg = 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1920';
  
  return (
    <section 
      className={`hero hero-${size}`}
      style={{
        backgroundImage: `url(${backgroundImage || defaultBg})`
      }}
    >
      <div className="hero-overlay" style={{ opacity: overlay }}></div>
      
      <div className="hero-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="hero-content">
        <div className="container">
          <h1 className="hero-title">{title}</h1>
          {subtitle && <p className="hero-subtitle">{subtitle}</p>}
          <div className="hero-buttons">
            <Link to={ctaPrimaryLink} className="btn btn-secondary">
              {ctaPrimary}
            </Link>
            {ctaSecondary && (
              <Link to={ctaSecondaryLink || '/programs'} className="btn btn-white">
                {ctaSecondary}
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <div className="hero-scroll">
        <span></span>
      </div>
    </section>
  );
};

export default Hero;
