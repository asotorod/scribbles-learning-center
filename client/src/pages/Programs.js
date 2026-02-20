import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { programsAPI } from '../services/api';
import './Programs.css';

// Programs data using design system colors - UPDATED age ranges per client feedback
const defaultPrograms = [
  {
    id: 1,
    name: "Infant Care",
    slug: "infant",
    age_range: "0–18 months",
    description: "A gentle, nurturing environment for your baby's first experiences with learning. Our trained caregivers focus on sensory development, early language skills, and creating secure attachments that form the foundation for lifelong learning. Instruction is provided in both English and Spanish as part of our dual-language curriculum.",
    features: [
      "1:3 teacher-to-child ratio (lower than NJ requirements)",
      "Daily activity and feeding reports",
      "Tummy time and sensory activities",
      "Safe sleep practices following AAP guidelines",
      "Flexible feeding schedules",
      "Dual-language instruction (English & Spanish)"
    ],
    image_url: "https://plus.unsplash.com/premium_photo-1679288660582-3cc3d3c65bb8?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#E79897" // Peony
  },
  {
    id: 2,
    name: "Toddler Program",
    slug: "toddler",
    age_range: "18–30 months",
    description: "Active exploration and discovery for curious toddlers! We encourage independence, language development, and social skills through structured play and creative activities designed to spark imagination and build confidence. Our curriculum-based approach ensures every activity supports your child's development.",
    features: [
      "1:5 teacher-to-child ratio (lower than NJ requirements)",
      "Potty training support",
      "Language-rich dual-language environment",
      "Music, movement, and art",
      "Outdoor playground time daily",
      "Social-emotional skill building"
    ],
    image_url: "https://images.unsplash.com/photo-1501686637-b7aa9c48a882?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#C6C09C" // Pistachio
  },
  {
    id: 3,
    name: "Preschool",
    slug: "preschool",
    age_range: "2 & 3 years",
    description: "Two separate classes designed for 2-year-olds and 3-year-olds, each with age-appropriate curriculum and activities. Our Creative Curriculum with HighScope approach prepares children for the next stage of their educational journey through play-based learning and dual-language instruction.",
    features: [
      "Separate classes for 2s and 3s",
      "Creative Curriculum with HighScope approach",
      "Pre-reading and early writing skills",
      "STEM activities and experiments",
      "Aligned with NJ Preschool Standards",
      "Dual-language instruction (English & Spanish)"
    ],
    image_url: "https://plus.unsplash.com/premium_photo-1684291228086-4fd45b967992?q=80&w=2342&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#FCC88A" // Honey
  },
  {
    id: 4,
    name: "Pre-Kindergarten",
    slug: "pre-k",
    age_range: "4–5 years",
    description: "Comprehensive kindergarten readiness through our curriculum-based approach. Children develop literacy, math, science, and social-emotional skills needed for academic success. Our program ensures your child is fully prepared for their educational journey ahead.",
    features: [
      "Kindergarten readiness curriculum",
      "Advanced literacy and math concepts",
      "Science experiments and discovery",
      "Creative arts and dramatic play",
      "Aligned with NJ Preschool Standards",
      "Kindergarten readiness assessment"
    ],
    image_url: "https://images.unsplash.com/photo-1588075592446-265fd1e6e76f?q=80&w=2344&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#768E78" // Fern
  },
  {
    id: 5,
    name: "Summer Camp",
    slug: "summer-camp",
    age_range: "Up to 5 years",
    description: "Fun-filled summer adventures combining learning and outdoor activities! Our summer camp provides engaging themed weeks, field trips, arts and crafts, and plenty of opportunities to make lasting friendships while continuing educational growth.",
    features: [
      "Weekly themed activities",
      "Field trips and special events",
      "Water play activities",
      "Arts, crafts, and STEM projects",
      "Sports and outdoor games",
      "Flexible enrollment options"
    ],
    image_url: "https://plus.unsplash.com/premium_photo-1723874432108-5057464ddd8f?q=80&w=2412&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#E79897" // Peony
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
      const apiPrograms = response?.data?.data?.programs;
      if (Array.isArray(apiPrograms) && apiPrograms.length > 0) {
        // Merge API data with defaults to ensure images and colors are present
        const mergedPrograms = apiPrograms.map(apiProg => {
          const defaultProg = defaultPrograms.find(d => d.slug === apiProg.slug || d.id === apiProg.id);
          return {
            ...defaultProg,
            ...apiProg,
            image_url: apiProg.image_url || defaultProg?.image_url,
            color: apiProg.color || defaultProg?.color,
            age_range: apiProg.age_range || defaultProg?.age_range,
            features: apiProg.features || defaultProg?.features,
          };
        });
        // Include any default programs not in API (e.g. newly added)
        const apiSlugs = apiPrograms.map(p => p.slug);
        const missingDefaults = defaultPrograms.filter(d => !apiSlugs.includes(d.slug));
        setPrograms([...mergedPrograms, ...missingDefaults].sort((a, b) => (a.id || a.sortOrder || 0) - (b.id || b.sortOrder || 0)));
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  return (
    <main>
      <Hero
        title="Our Programs"
        subtitle="Curriculum-based early learning experiences designed to nurture your child's growth"
        backgroundImage="https://plus.unsplash.com/premium_photo-1663127348902-44f1f20dd92d?q=80&w=2338&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        size="medium"
        ctaPrimary="Schedule a Tour"
        ctaPrimaryLink="/contact"
      />

      <section className="section">
        <div className="container">
          <div className="programs-intro">
            <h2>An Early Learning Center, Not Just Childcare</h2>
            <p>
              At Scribbles Learning Center, we are an <strong>early learning facility</strong> with curriculum
              implemented from infancy through pre-kindergarten. We are also a <strong>dual-language learning center</strong>,
              with instruction in both English and Spanish as part of our everyday curriculum.
            </p>
          </div>

          {/* Dual Language Highlight */}
          <div className="dual-language-banner">
            <div className="dual-language-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div className="dual-language-content">
              <h3>Dual-Language Learning Center</h3>
              <p>Instruction is implemented in both <strong>English and Spanish</strong> as part of our curriculum, giving children the advantage of bilingual exposure from an early age.</p>
            </div>
          </div>

          {(programs || []).map((program, index) => (
            <div
              key={program.id}
              id={program.slug}
              className={`program-detail ${index % 2 === 1 ? 'reverse' : ''}`}
            >
              <div className="program-detail-image">
                <img src={program.image_url} alt={`${program.name} - children learning and playing in our ${program.age_range} classroom`} />
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
                  {(program.features || []).map((feature, i) => (
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

      {/* Staff Ratios Section */}
      <section className="section section-ratios">
        <div className="container">
          <div className="section-header">
            <h2>Lower Staff-to-Child Ratios</h2>
            <p>We provide <strong>better than required</strong> ratios for younger classrooms</p>
          </div>
          <div className="ratios-grid">
            <div className="ratio-card">
              <div className="ratio-number">1:3</div>
              <div className="ratio-label">Infants</div>
              <div className="ratio-note">Lower than NJ requirement</div>
            </div>
            <div className="ratio-card">
              <div className="ratio-number">1:5</div>
              <div className="ratio-label">Toddlers</div>
              <div className="ratio-note">Lower than NJ requirement</div>
            </div>
            <div className="ratio-card">
              <div className="ratio-number">1:10</div>
              <div className="ratio-label">Preschool</div>
              <div className="ratio-note">Meets NJ requirement</div>
            </div>
            <div className="ratio-card">
              <div className="ratio-number">1:10</div>
              <div className="ratio-label">Pre-Kindergarten</div>
              <div className="ratio-note">Meets NJ requirement</div>
            </div>
          </div>
          <p className="ratios-description">
            Our lower ratios mean more individualized attention for each child, especially during the crucial early years of development.
          </p>
        </div>
      </section>

      {/* Flexible Scheduling Section */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header">
            <h2>Flexible Scheduling Options</h2>
            <p>We work with your family's unique needs</p>
          </div>
          <div className="scheduling-grid">
            <div className="scheduling-card">
              <div className="scheduling-icon" style={{ background: '#E79897' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h3>Part-Time & Full-Time</h3>
              <p>Choose the schedule that works best for your family, whether that's a few days a week or full-time care.</p>
            </div>
            <div className="scheduling-card">
              <div className="scheduling-icon" style={{ background: '#C6C09C' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3>No Fixed Days Required</h3>
              <p>If attending less than 5 days, you don't need to assign specific days of the week. Flexibility is built in.</p>
            </div>
            <div className="scheduling-card">
              <div className="scheduling-icon" style={{ background: '#FCC88A' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Capacity-Based Enrollment</h3>
              <p>Children are enrolled based on classroom capacity rather than fixed schedules, allowing for rotating arrangements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* NJ Requirements Section */}
      <section className="section">
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
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h3>NJ DOE Approved</h3>
              <p>Our curriculum is approved by the NJ Department of Education and aligned with state learning standards.</p>
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
