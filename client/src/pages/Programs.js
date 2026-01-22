import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { programsAPI } from '../services/api';
import './Programs.css';

// Programs data using design system colors
const defaultPrograms = [
  {
    id: 1,
    name: "Infant Care",
    slug: "infant",
    age_range: "6 weeks - 18 months",
    description: "A gentle, nurturing environment for your baby's first experiences with learning. Our trained caregivers focus on sensory development, early language skills, and creating secure attachments that form the foundation for lifelong learning.",
    features: [
      "Low 1:4 teacher-to-child ratio",
      "Daily activity and feeding reports",
      "Tummy time and sensory activities",
      "Safe sleep practices following AAP guidelines",
      "Flexible feeding schedules",
      "Parent communication app"
    ],
    image_url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800",
    color: "#E79897" // Peony
  },
  {
    id: 2,
    name: "Toddler Program",
    slug: "toddler",
    age_range: "18 months - 3 years",
    description: "Active exploration and discovery for curious toddlers! We encourage independence, language development, and social skills through structured play and creative activities designed to spark imagination and build confidence.",
    features: [
      "1:6 teacher-to-child ratio",
      "Potty training support",
      "Language-rich environment",
      "Music, movement, and art",
      "Outdoor playground time daily",
      "Social-emotional skill building"
    ],
    image_url: "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=800",
    color: "#C6C09C" // Pistachio
  },
  {
    id: 3,
    name: "Preschool",
    slug: "preschool",
    age_range: "3 - 5 years",
    description: "Kindergarten readiness through play-based learning. Our comprehensive curriculum covers literacy, math, science, and social-emotional development, ensuring your child is fully prepared for their educational journey ahead.",
    features: [
      "1:10 teacher-to-child ratio",
      "Pre-reading and writing skills",
      "STEM activities and experiments",
      "Creative arts and dramatic play",
      "Aligned with NJ Preschool Standards",
      "Kindergarten readiness assessment"
    ],
    image_url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
    color: "#FCC88A" // Honey
  },
  {
    id: 4,
    name: "Summer Camp",
    slug: "summer-camp",
    age_range: "5 - 12 years",
    description: "Fun-filled summer adventures combining learning and outdoor activities! Our summer camp provides engaging themed weeks, field trips, swimming, arts and crafts, and plenty of opportunities to make lasting friendships.",
    features: [
      "Weekly themed activities",
      "Field trips and special events",
      "Swimming and water play",
      "Arts, crafts, and STEM projects",
      "Sports and outdoor games",
      "Flexible enrollment options"
    ],
    image_url: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800",
    color: "#768E78" // Fern
  }
];

const Programs = () => {
  const [programs, setPrograms] = useState(defaultPrograms);

  useEffect(() => {
    fetchPrograms();
    // Handle anchor navigation
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await programsAPI.getAll();
      if (response?.data?.data) {
        setPrograms(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  return (
    <main>
      <Hero
        title="Our Programs"
        subtitle="Age-appropriate learning experiences designed to nurture your child's growth"
        backgroundImage="https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=1920"
        size="medium"
        ctaPrimary="Schedule a Tour"
        ctaPrimaryLink="/contact"
      />

      <section className="section">
        <div className="container">
          <div className="programs-intro">
            <p>At Scribbles Learning Center, we offer comprehensive programs for children from 6 weeks through 12 years. Each program is designed to meet the developmental needs of different age groups while fostering a love of learning in a safe, nurturing environment.</p>
          </div>

          {programs.map((program, index) => (
            <div
              key={program.id}
              id={program.slug}
              className={`program-detail ${index % 2 === 1 ? 'reverse' : ''}`}
            >
              <div className="program-detail-image">
                <img src={program.image_url} alt={program.name} />
                <div className="program-detail-badge" style={{ background: program.color }}>
                  {program.age_range}
                </div>
              </div>
              <div className="program-detail-content">
                <div className="program-color-bar" style={{ background: program.color }}></div>
                <h2>{program.name}</h2>
                <p className="program-description">{program.description}</p>
                <h4>What We Offer:</h4>
                <ul className="program-features">
                  {program.features.map((feature, i) => (
                    <li key={i}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/contact" className="btn btn-primary" style={{ background: program.color, borderColor: program.color }}>
                  Inquire About {program.name}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NJ Requirements Section */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header">
            <h2>Meeting NJ Childcare Standards</h2>
            <p>We exceed state requirements to provide the best care for your child</p>
          </div>
          <div className="requirements-grid">
            <div className="requirement-card">
              <div className="requirement-icon" style={{ background: '#E79897' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>DCF Licensed</h3>
              <p>Fully licensed by NJ Department of Children and Families with annual inspections and compliance.</p>
            </div>
            <div className="requirement-card">
              <div className="requirement-icon" style={{ background: '#C6C09C' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Staff Ratios</h3>
              <p>We meet or exceed NJ required staff-to-child ratios: 1:4 infants, 1:6 toddlers, 1:10 preschool.</p>
            </div>
            <div className="requirement-card">
              <div className="requirement-icon" style={{ background: '#FCC88A' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3>Background Checks</h3>
              <p>All staff undergo comprehensive background checks including CARI, fingerprinting, and references.</p>
            </div>
            <div className="requirement-card">
              <div className="requirement-icon" style={{ background: '#768E78' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h3>Certified Teachers</h3>
              <p>Our teachers hold CDA credentials or early childhood education degrees with ongoing training.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment CTA */}
      <section className="section section-primary">
        <div className="container">
          <div className="enrollment-cta">
            <h2>Ready to Enroll?</h2>
            <p>Contact us to learn about availability and schedule a tour of our facility.</p>
            <div className="enrollment-buttons">
              <Link to="/contact" className="btn btn-white">Schedule a Tour</Link>
              <a href="tel:+12019459445" className="btn btn-outline-white">Call (201) 945-9445</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Programs;
