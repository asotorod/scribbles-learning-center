import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import api from '../services/api';
import './Careers.css';

const defaultJobs = [
  {
    id: 1,
    title: "Lead Preschool Teacher",
    department: "Education",
    type: "Full-Time",
    description: "We are seeking an experienced and passionate Lead Preschool Teacher to join our team. The ideal candidate will have a deep understanding of early childhood development and a commitment to creating engaging learning experiences.",
    requirements: [
      "Bachelor's degree in Early Childhood Education or related field",
      "NJ Teaching Certification preferred",
      "Minimum 2 years experience in preschool setting",
      "Strong classroom management skills",
      "Excellent communication with children and parents"
    ],
    benefits: ["Professional development", "Childcare discount", "Flexible scheduling"],
    is_active: true
  },
  {
    id: 2,
    title: "Infant Room Caregiver",
    department: "Education",
    type: "Full-Time",
    description: "Join our infant care team to provide nurturing care for children ages 0 to 18 months. This role requires patience, gentleness, and a genuine love for working with babies.",
    requirements: [
      "CDA credential or equivalent",
      "Experience with infants required",
      "CPR and First Aid certification",
      "Understanding of infant development milestones",
      "Ability to lift up to 30 lbs"
    ],
    benefits: ["Professional development", "Childcare discount", "Flexible scheduling"],
    is_active: true
  },
  {
    id: 3,
    title: "Part-Time Assistant Teacher",
    department: "Education",
    type: "Part-Time",
    description: "Looking for a caring individual to assist our lead teachers in the toddler and preschool classrooms. Flexible hours available, perfect for students or those seeking part-time work.",
    requirements: [
      "High school diploma required",
      "Currently pursuing ECE degree preferred",
      "Experience with young children",
      "Energetic and patient demeanor",
      "Background check required"
    ],
    benefits: ["Flexible schedule", "Professional development", "Childcare discount"],
    is_active: true
  }
];

const benefits = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    title: "Professional Growth",
    description: "Ongoing training and career development opportunities"
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: "Team Environment",
    description: "Supportive, family-like workplace culture"
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    title: "Childcare Discount",
    description: "Reduced rates for employees' children enrolled"
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    title: "Flexible Scheduling",
    description: "Part-time positions with flexible hours available"
  }
];

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/hr/jobs', { params: { is_active: true } });
      const jobs = response?.data?.data?.jobs;
      setJobs(Array.isArray(jobs) ? jobs : defaultJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs(defaultJobs);
    } finally {
      setLoading(false);
    }
  };

  const activeJobs = jobs.filter(job => job.is_active);

  return (
    <main>
      <Hero
        title="Join Our Team"
        subtitle="Build your career while making a difference in children's lives"
        backgroundImage="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920"
        size="medium"
        ctaPrimary="View Open Positions"
        ctaPrimaryLink="#positions"
      />

      {/* Why Work at Scribbles */}
      <section className="section">
        <div className="container">
          <div className="careers-intro">
            <h2>Why Work at Scribbles?</h2>
            <p>
              At Scribbles Learning Center, we believe that happy teachers create happy classrooms.
              We invest in our staff because we know that when our team thrives, our children thrive.
              Join a supportive, family-like environment where your passion for early childhood
              education is valued and nurtured.
            </p>
          </div>

          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon">
                  {benefit.icon}
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="section section-cream">
        <div className="container">
          <div className="section-header">
            <h2>Open Positions</h2>
            <p>Find your perfect role at Scribbles Learning Center</p>
          </div>

          {loading ? (
            <div className="loading-jobs">
              <div className="loading-spinner"></div>
              <p>Loading positions...</p>
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="no-jobs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              <h3>No Open Positions</h3>
              <p>We don't have any open positions right now, but we're always looking for great people. Send us your resume!</p>
              <Link to="/contact" className="btn btn-primary">Contact Us</Link>
            </div>
          ) : (
            <div className="jobs-list">
              {activeJobs.map((job) => (
                <div key={job.id} className={`job-card ${selectedJob === job.id ? 'expanded' : ''}`}>
                  <div className="job-header" onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}>
                    <div className="job-title-section">
                      <h3>{job.title}</h3>
                      <div className="job-tags">
                        <span className="job-tag department">{job.department}</span>
                        <span className="job-tag type">{job.type}</span>
                      </div>
                    </div>
                    <button className="job-toggle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {selectedJob === job.id ? (
                          <polyline points="18 15 12 9 6 15"/>
                        ) : (
                          <polyline points="6 9 12 15 18 9"/>
                        )}
                      </svg>
                    </button>
                  </div>

                  {selectedJob === job.id && (
                    <div className="job-details">
                      <div className="job-description">
                        <h4>About This Role</h4>
                        <p>{job.description}</p>
                      </div>

                      <div className="job-requirements">
                        <h4>Requirements</h4>
                        <ul>
                          {(job.requirements || []).map((req, i) => (
                            <li key={i}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {job.benefits && (
                        <div className="job-benefits">
                          <h4>Benefits</h4>
                          <div className="benefits-tags">
                            {(job.benefits || []).map((benefit, i) => (
                              <span key={i} className="benefit-tag">{benefit}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="job-actions">
                        <Link to={`/contact?subject=careers&position=${encodeURIComponent(job.title)}`} className="btn btn-primary">
                          Apply Now
                        </Link>
                        <span className="or-text">or email resume to careers@scribbleslearning.com</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-primary">
        <div className="container">
          <div className="careers-cta">
            <h2>Ready to Make a Difference?</h2>
            <p>Join our team of passionate educators and help shape young minds</p>
            <div className="cta-buttons">
              <Link to="/contact?subject=careers" className="btn btn-white">Apply Today</Link>
              <a href="mailto:careers@scribbleslearning.com" className="btn btn-outline-white">
                Email Your Resume
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Careers;
