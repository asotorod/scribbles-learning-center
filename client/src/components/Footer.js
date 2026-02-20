import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="var(--primary)"></path>
        </svg>
      </div>

      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <img src="/logo.png" alt="Scribbles Learning Center" />
                <span>Scribbles</span>
              </Link>
              <p>A nurturing home away from home where every child can learn, grow, and thrive since 2008.</p>
              <div className="footer-social">
                <a href="https://facebook.com/scribbleslearningcenter" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z"/></svg>
                </a>
                <a href="https://instagram.com/scribbleslearning" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
                </a>
              </div>
            </div>

            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/programs">Programs</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/login">Parent Portal</Link></li>
                <li><Link to="/admin/login">Admin Login</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service">Terms of Service</Link></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Programs</h4>
              <ul>
                <li><Link to="/programs#infant">Infant Care</Link></li>
                <li><Link to="/programs#toddler">Toddler Program</Link></li>
                <li><Link to="/programs#preschool">Preschool</Link></li>
                <li><Link to="/programs#summer-camp">Summer Camp</Link></li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4>Contact Us</h4>
              <div className="contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div>
                  <p>725 River Rd, Suite 103</p>
                  <p>Edgewater, NJ 07020</p>
                </div>
              </div>
              <div className="contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <div>
                  <a href="tel:+12019459445">(201) 945-9445</a>
                  <a href="tel:+12019579779" style={{ display: 'block', marginTop: '4px' }}>(201) 957-9779</a>
                </div>
              </div>
              <div className="contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <div>
                  <p>Mon - Fri: 7:30 AM - 6:30 PM</p>
                  <p>Sat - Sun: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2008-2026 Scribbles Learning Center. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
          <p className="footer-credit">
            Website by <a href="https://svtconsulting.com" target="_blank" rel="noopener noreferrer">SVT Consulting</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
