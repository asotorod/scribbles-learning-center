import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './ParentApp.css';

const appFeatures = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Real-Time Notifications',
    description: 'Get instant push notifications the moment your child is checked in or out at the daycare kiosk.',
    color: '#E79897'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
        <path d="M8 18h.01" /><path d="M12 18h.01" />
      </svg>
    ),
    title: 'Attendance History',
    description: 'View your child\'s complete check-in and check-out history with exact timestamps.',
    color: '#C6C09C'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    title: 'Report Absences',
    description: 'Submit absence reports directly from your phone — no calls or emails needed.',
    color: '#FCC88A'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Secure Messaging',
    description: 'Message center administrators directly through the app. Stay informed about your child\'s care.',
    color: '#768E78'
  }
];

const steps = [
  {
    number: '1',
    title: 'Download the App',
    description: 'Get Scribbles Learning free from the App Store on your iPhone.',
    color: '#E79897'
  },
  {
    number: '2',
    title: 'Log In',
    description: 'Use the credentials provided by Scribbles Learning Center when your child enrolls.',
    color: '#C6C09C'
  },
  {
    number: '3',
    title: 'Stay Connected',
    description: 'Get real-time updates, manage attendance, and communicate with the center.',
    color: '#768E78'
  }
];

const ParentApp = () => {
  return (
    <main>
      <Hero
        title="Your Child's Day, Right in Your Pocket"
        subtitle="Download the Scribbles Learning parent app and stay connected to every moment at the center"
        backgroundImage="https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2340&auto=format&fit=crop"
        size="medium"
        ctaPrimary="Download on App Store"
        ctaPrimaryLink="/app#download"
        ctaSecondary="Learn More"
        ctaSecondaryLink="/app#features"
      />

      {/* App Features */}
      <section className="section section-cream" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Everything You Need as a Parent</h2>
            <p>Stay informed and in control with powerful features designed for busy families</p>
          </div>
          <div className="app-features-grid">
            {appFeatures.map((feature, index) => (
              <div key={index} className="app-feature-card">
                <div className="app-feature-icon" style={{ background: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview / Showcase */}
      <section className="section">
        <div className="container">
          <div className="app-showcase">
            <div className="app-showcase-content">
              <h2>Built for Scribbles Families</h2>
              <p className="app-showcase-subtitle">A dedicated app for parents at Scribbles Learning Center</p>
              <p>
                The Scribbles Learning app gives you a direct connection to your child's daily experience at the center.
                From the moment they're checked in to when you pick them up, you'll know exactly what's happening.
              </p>
              <ul className="app-highlights">
                <li>
                  <span className="highlight-check">✓</span>
                  <span>Instant push notifications for check-in and check-out</span>
                </li>
                <li>
                  <span className="highlight-check">✓</span>
                  <span>Complete attendance history with timestamps</span>
                </li>
                <li>
                  <span className="highlight-check">✓</span>
                  <span>One-tap absence reporting</span>
                </li>
                <li>
                  <span className="highlight-check">✓</span>
                  <span>Direct messaging with center staff</span>
                </li>
                <li>
                  <span className="highlight-check">✓</span>
                  <span>Manage emergency contacts and account info</span>
                </li>
                <li>
                  <span className="highlight-check">✓</span>
                  <span>Free to download — no subscription required</span>
                </li>
              </ul>
            </div>
            <div className="app-showcase-phone">
              <div className="phone-frame">
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="phone-status-bar">
                    <span>9:41</span>
                    <span className="phone-status-icons">●●●</span>
                  </div>
                  <div className="phone-app-header">
                    <div className="phone-logo-circle"></div>
                    <span>Scribbles Learning</span>
                  </div>
                  <div className="phone-notification">
                    <div className="notif-icon" style={{ background: '#768E78' }}>✓</div>
                    <div className="notif-text">
                      <strong>Check-In Confirmed</strong>
                      <p>Emma was checked in at 8:15 AM</p>
                    </div>
                  </div>
                  <div className="phone-notification">
                    <div className="notif-icon" style={{ background: '#E79897' }}>♡</div>
                    <div className="notif-text">
                      <strong>New Message</strong>
                      <p>Angie: Emma had a great day today!</p>
                    </div>
                  </div>
                  <div className="phone-card">
                    <div className="phone-card-label">Today's Attendance</div>
                    <div className="phone-card-row">
                      <span>Check-in</span>
                      <span style={{ color: '#768E78', fontWeight: 600 }}>8:15 AM</span>
                    </div>
                    <div className="phone-card-row">
                      <span>Check-out</span>
                      <span style={{ color: '#6B6B6B' }}>Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-primary">
        <div className="container">
          <div className="section-header light">
            <h2>How to Get Started</h2>
            <p>You'll be up and running in minutes</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number" style={{ background: step.color }}>
                  {step.number}
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="section" id="download">
        <div className="container">
          <div className="download-section">
            <div className="download-content">
              <h2>Download Scribbles Learning</h2>
              <p>Available now on the App Store for iPhone. Free for all enrolled families.</p>
              <a
                href="https://apps.apple.com/app/scribbleslearning/id6758914925"
                target="_blank"
                rel="noopener noreferrer"
                className="app-store-badge"
                aria-label="Download on the App Store"
              >
                <svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="40" rx="6" fill="#000" />
                  <g fill="#fff">
                    <path d="M24.77 20.3a4.95 4.95 0 0 1 2.36-4.15 5.07 5.07 0 0 0-3.99-2.16c-1.68-.18-3.31 1.01-4.17 1.01-.87 0-2.18-.99-3.59-.96a5.31 5.31 0 0 0-4.47 2.72c-1.93 3.34-.49 8.27 1.36 10.97.93 1.33 2.02 2.81 3.44 2.76 1.39-.06 1.91-.88 3.58-.88 1.66 0 2.15.88 3.59.85 1.49-.02 2.44-1.33 3.34-2.67a11.05 11.05 0 0 0 1.52-3.11 4.78 4.78 0 0 1-2.97-4.38z" />
                    <path d="M22.15 12.21a4.87 4.87 0 0 0 1.12-3.49 4.96 4.96 0 0 0-3.21 1.66 4.64 4.64 0 0 0-1.15 3.36 4.1 4.1 0 0 0 3.24-1.53z" />
                    <text x="42" y="15" fontSize="7" fontWeight="400" fontFamily="Arial, sans-serif">Download on the</text>
                    <text x="42" y="27" fontSize="12" fontWeight="600" fontFamily="Arial, sans-serif">App Store</text>
                  </g>
                </svg>
              </a>
              <p className="download-note">
                Requires an account from Scribbles Learning Center.
                <br />
                Don't have one? <Link to="/contact">Contact us</Link> to enroll your child.
              </p>
            </div>
            <div className="download-qr">
              <div className="qr-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="qr-icon">
                  <rect x="2" y="2" width="8" height="8" rx="1" />
                  <rect x="14" y="2" width="8" height="8" rx="1" />
                  <rect x="2" y="14" width="8" height="8" rx="1" />
                  <rect x="14" y="14" width="4" height="4" rx="0.5" />
                  <rect x="20" y="14" width="2" height="2" rx="0.25" />
                  <rect x="14" y="20" width="2" height="2" rx="0.25" />
                  <rect x="18" y="18" width="4" height="4" rx="0.5" />
                  <rect x="5" y="5" width="2" height="2" rx="0.25" />
                  <rect x="17" y="5" width="2" height="2" rx="0.25" />
                  <rect x="5" y="17" width="2" height="2" rx="0.25" />
                </svg>
                <p>Scan to download</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Not Yet Enrolled?</h2>
            <p>Schedule a tour and see why families have trusted Scribbles since 2008!</p>
            <div className="cta-buttons">
              <Link to="/contact" className="btn btn-cta">Schedule a Tour</Link>
              <a href="tel:+12019459445" className="btn btn-outline">
                Call (201) 945-9445
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ParentApp;
