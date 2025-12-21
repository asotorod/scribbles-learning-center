import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import './Programs.css';

// Default programs data - no API needed for demo
const defaultPrograms = [
  {
    id: 1,
    title: "Infant Care",
    slug: "infant",
    ageRange: "6 weeks - 18 months",
    description: "A gentle, nurturing environment for your baby's first experiences with learning. Our trained caregivers focus on sensory development, early language skills, and creating secure attachments.",
    features: ["Low teacher-to-child ratios", "Daily activity reports", "Flexible feeding schedules", "Safe sleep practices"],
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800",
    color: "#FFB3B3"
  },
  {
    id: 2,
    title: "Toddler Program",
    slug: "toddler",
    ageRange: "18 months - 3 years",
    description: "Active exploration and discovery for curious toddlers! We encourage independence, language development, and social skills through structured play and creative activities.",
    features: ["Potty training support", "Language-rich environment", "Music and movement", "Outdoor playground time"],
    image: "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=800",
    color: "#A8E6E2"
  },
  {
    id: 3,
    title: "Preschool",
    slug: "preschool",
    ageRange: "3 - 5 years",
    description: "Kindergarten readiness through play-based learning. Our comprehensive curriculum covers literacy, math, science, and social-emotional development.",
    features: ["Pre-reading and writing skills", "STEM activities", "Creative arts", "Social skills development"],
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
    color: "#FFE66D"
  },
  {
    id: 4,
    title: "After School Care",
    slug: "after-school",
    ageRange: "5 - 12 years",
    description: "A safe and enriching environment for school-age children. We provide homework help, recreational activities, and a healthy snack.",
    features: ["Homework assistance", "Indoor and outdoor activities", "Healthy snacks", "Flexible pickup times"],
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800",
    color: "#C4B5FD"
  }
];

const Programs = () => {
  const [programs] = useState(defaultPrograms);

  useEffect(() => {
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
            <p>At Scribbles Learning Center, we offer comprehensive programs for children from 6 weeks through 12 years. Each program is designed to meet the developmental needs of different age groups while fostering a love of learning.</p>
          </div>

          {programs.map((program, index) => (
            <div 
              key={program.id} 
              id={program.slug}
              className={`program-detail ${index % 2 === 1 ? 'reverse' : ''}`}
            >
              <div className="program-detail-image">
                <img src={program.image} alt={program.title} />
                <div className="program-detail-badge" style={{ background: program.color }}>
                  {program.ageRange}
                </div>
              </div>
              <div className="program-detail-content">
                <h2>{program.title}</h2>
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
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enrollment CTA */}
      <section className="section section-primary">
        <div className="container">
          <div className="enrollment-cta">
            <h2>Ready to Enroll?</h2>
            <p>Contact us to learn about availability and schedule a tour of our facility.</p>
            <div className="enrollment-buttons">
              <a href="/contact" className="btn btn-white">Schedule a Tour</a>
              <a href="tel:+12019459445" className="btn btn-outline-white">Call (201) 945-9445</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Programs;
