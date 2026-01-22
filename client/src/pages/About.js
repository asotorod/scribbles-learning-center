import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './About.css';

const About = () => {
  return (
    <main>
      <Hero
        title="About Us"
        subtitle="Learn about our story, mission, and the dedicated team behind Scribbles"
        backgroundImage="https://plus.unsplash.com/premium_photo-1681842152160-cb5e5d470ddd?q=80&w=2456&auto=format&fit=crop"
        size="medium"
        ctaPrimary="Schedule a Tour"
        ctaPrimaryLink="/contact"
      />

      {/* The Scribbles Difference */}
      <section className="section">
        <div className="container">
          <div className="about-story">
            <div className="about-story-content">
              <h2>The Scribbles Difference</h2>
              <p className="story-subtitle">Nurturing Young Minds Since 2008</p>
              <p>
                Scribbles Learning Center is a family-owned childcare facility dedicated to providing
                a safe, loving, and educational environment for children. Founded in 2008, we've spent
                over 17 years caring for the children of Edgewater and surrounding communities,
                becoming a trusted partner for hundreds of families.
              </p>
              <p>
                With a capacity of 45 children, we maintain an intimate, family-like atmosphere where
                every child receives the individual attention they deserve. Our experienced staff knows
                each child by name and works closely with parents to support their child's unique
                development journey.
              </p>
              <div className="about-stats">
                <div className="stat-item">
                  <span className="stat-number">2008</span>
                  <span className="stat-label">Founded</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">45</span>
                  <span className="stat-label">Children Capacity</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Families Served</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">17+</span>
                  <span className="stat-label">Years Experience</span>
                </div>
              </div>
            </div>
            <div className="about-story-image">
              <img
                src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"
                alt="Children learning at Scribbles"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission & Values */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header">
            <h2>Our Mission & Values</h2>
            <p>The principles that guide everything we do</p>
          </div>
          <div className="mission-box">
            <p>
              Our mission is to create a nurturing home away from home where every child can learn,
              grow, and thrive. We believe every child is unique and deserves individualized attention
              to reach their full potential.
            </p>
          </div>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon" style={{ background: '#E79897' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Safety First</h3>
              <p>Video-monitored rooms, secure entry systems, and comprehensive safety protocols keep your child protected at all times.</p>
            </div>
            <div className="value-card">
              <div className="value-icon" style={{ background: '#C6C09C' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h3>Family Atmosphere</h3>
              <p>We treat every child as if they were our own family member, creating bonds that last a lifetime.</p>
            </div>
            <div className="value-card">
              <div className="value-icon" style={{ background: '#FCC88A' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h3>Quality Education</h3>
              <p>Our curriculum is aligned with NJ Preschool Teaching & Learning Standards, preparing children for success.</p>
            </div>
            <div className="value-card">
              <div className="value-icon" style={{ background: '#768E78' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3>Flexibility</h3>
              <p>Part-time and full-time schedules to meet your family's unique needs and busy lifestyle.</p>
            </div>
          </div>
        </div>
      </section>

      {/* NJ Requirements Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>NJ Licensing & Requirements</h2>
            <p>Meeting and exceeding state childcare standards</p>
          </div>
          <div className="requirements-content">
            <div className="requirement-detail">
              <div className="requirement-badge" style={{ background: '#E79897' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="requirement-info">
                <h3>DCF Licensed Facility</h3>
                <p>
                  Scribbles Learning Center is fully licensed by the New Jersey Department of Children
                  and Families (DCF). We undergo regular inspections and maintain strict compliance
                  with all state regulations for childcare facilities.
                </p>
              </div>
            </div>
            <div className="requirement-detail">
              <div className="requirement-badge" style={{ background: '#C6C09C' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="requirement-info">
                <h3>Staff-to-Child Ratios</h3>
                <p>
                  We meet or exceed NJ required staff-to-child ratios to ensure individualized attention:
                </p>
                <ul>
                  <li><strong>Infants:</strong> 1 teacher per 4 children</li>
                  <li><strong>Toddlers:</strong> 1 teacher per 6 children</li>
                  <li><strong>Preschool:</strong> 1 teacher per 10 children</li>
                </ul>
              </div>
            </div>
            <div className="requirement-detail">
              <div className="requirement-badge" style={{ background: '#FCC88A' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="requirement-info">
                <h3>Staff Qualifications</h3>
                <p>
                  All staff members undergo comprehensive background checks including CARI, fingerprinting,
                  and reference verification. Our teachers hold CDA credentials or early childhood education
                  degrees and participate in ongoing professional development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare Network Section */}
      <section className="section section-healthcare">
        <div className="container">
          <div className="healthcare-content">
            <div className="healthcare-text">
              <h2>Healthcare Network On-Site</h2>
              <p className="healthcare-subtitle">Convenient access to pediatric care</p>
              <p>
                One of the unique advantages of Scribbles Learning Center is our location within a
                healthcare network. We share our building with trusted medical professionals, providing
                parents with convenient access to healthcare services for their children.
              </p>
              <div className="healthcare-providers">
                <div className="provider-card">
                  <div className="provider-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Pediatrician</h4>
                    <p>Board-certified pediatrician located in the same building for routine checkups and sick visits.</p>
                  </div>
                </div>
                <div className="provider-card">
                  <div className="provider-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Pediatric Dentist</h4>
                    <p>Gentle dental care for children available right in our building for cleanings and checkups.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="healthcare-image">
              <img
                src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800"
                alt="Healthcare network"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Staff Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Meet Our Team</h2>
            <p>Dedicated educators who love what they do</p>
          </div>
          <div className="staff-grid">
            <div className="staff-card">
              <div className="staff-image">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400" alt="Director" />
              </div>
              <div className="staff-info">
                <h3>Maria Rodriguez</h3>
                <p className="staff-role">Director & Founder</p>
                <p className="staff-bio">With over 20 years in early childhood education, Maria founded Scribbles to create the loving environment she always envisioned for children.</p>
                <div className="staff-credentials">
                  <span className="credential-badge">CDA Certified</span>
                  <span className="credential-badge">CPR/First Aid</span>
                </div>
              </div>
            </div>
            <div className="staff-card">
              <div className="staff-image">
                <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400" alt="Lead Teacher" />
              </div>
              <div className="staff-info">
                <h3>Sarah Johnson</h3>
                <p className="staff-role">Lead Preschool Teacher</p>
                <p className="staff-bio">Sarah brings creativity and enthusiasm to our preschool classroom, preparing children for kindergarten success.</p>
                <div className="staff-credentials">
                  <span className="credential-badge">B.A. Early Childhood</span>
                  <span className="credential-badge">NJ Certified</span>
                </div>
              </div>
            </div>
            <div className="staff-card">
              <div className="staff-image">
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400" alt="Infant Supervisor" />
              </div>
              <div className="staff-info">
                <h3>Emily Chen</h3>
                <p className="staff-role">Infant Room Supervisor</p>
                <p className="staff-bio">Emily's gentle approach and expertise in infant development make her a favorite among our youngest learners and their families.</p>
                <div className="staff-credentials">
                  <span className="credential-badge">Infant/Toddler CDA</span>
                  <span className="credential-badge">CPR/First Aid</span>
                </div>
              </div>
            </div>
          </div>
          <div className="staff-cta">
            <p>Interested in joining our team?</p>
            <Link to="/careers" className="btn btn-outline">View Open Positions</Link>
          </div>
        </div>
      </section>

      {/* Certifications Bar */}
      <section className="section section-primary">
        <div className="container">
          <div className="certifications">
            <div className="certification-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <h3>Licensed by NJ DCF</h3>
              <p>State licensed childcare facility</p>
            </div>
            <div className="certification-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h3>CPR & First Aid Certified</h3>
              <p>All staff trained and certified</p>
            </div>
            <div className="certification-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h3>Women-Owned Business</h3>
              <p>Family-run since 2008</p>
            </div>
            <div className="certification-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <h3>Secure Facility</h3>
              <p>Video monitoring & secure entry</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
