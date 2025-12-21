import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { contentAPI } from '../services/api';
import './Home.css';

const Home = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await contentAPI.getAll();
        setContent(response.data);
      } catch (error) {
        console.error('Error fetching content:', error);
        // Use default content if API fails
        setContent(defaultContent);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const { hero, programs, about, testimonials, contact } = content || defaultContent;

  return (
    <main>
      <Hero
        title={hero?.title || "Where Little Minds Grow Big"}
        subtitle={hero?.subtitle || "A nurturing home away from home for your child in Edgewater, NJ"}
        backgroundImage={hero?.image}
        ctaPrimary="Schedule a Tour"
        ctaPrimaryLink="/contact"
        ctaSecondary="Our Programs"
        ctaSecondaryLink="/programs"
      />

      {/* Why Choose Us Section */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Scribbles?</h2>
            <p>We're more than just a daycare - we're a family</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon" style={{ background: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Preview */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Our Programs</h2>
            <p>Age-appropriate learning experiences for every stage</p>
          </div>
          <div className="programs-grid">
            {programs?.slice(0, 4).map((program) => (
              <Link to={`/programs#${program.slug}`} key={program.id} className="program-card">
                <div className="program-image">
                  <img src={program.image} alt={program.title} />
                  <div className="program-badge" style={{ background: program.color }}>
                    {program.ageRange}
                  </div>
                </div>
                <div className="program-content">
                  <h3>{program.title}</h3>
                  <p>{program.description.substring(0, 100)}...</p>
                  <span className="program-link">Learn More →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/programs" className="btn btn-primary">View All Programs</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section-primary">
        <div className="container">
          <div className="section-header light">
            <h2>What Parents Say</h2>
            <p>Real stories from our Scribbles family</p>
          </div>
          <div className="testimonials-grid">
            {testimonials?.slice(0, 3).map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-stars">
                  {'★'.repeat(testimonial.rating)}
                </div>
                <blockquote>"{testimonial.quote}"</blockquote>
                <p className="testimonial-author">- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Join Our Family?</h2>
            <p>Schedule a tour and see why families love Scribbles!</p>
            <div className="cta-buttons">
              <Link to="/contact" className="btn btn-secondary">Schedule a Tour</Link>
              <a href={`tel:${contact?.phone}`} className="btn btn-outline">
                Call {contact?.phone || "(201) 945-9445"}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

// Feature data
const features = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Safe & Secure",
    description: "Video-monitored rooms and secure entry systems for your peace of mind.",
    color: "#FFB3B3"
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: "Family Atmosphere",
    description: "We treat every child as if they were our own family member.",
    color: "#A8E6E2"
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    title: "Quality Education",
    description: "Curriculum aligned with NJ Preschool Teaching & Learning Standards.",
    color: "#FFE66D"
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    title: "Flexible Hours",
    description: "Part-time and full-time schedules to meet your family's needs.",
    color: "#C4B5FD"
  }
];

// Default content fallback
const defaultContent = {
  hero: {
    title: "Where Little Minds Grow Big",
    subtitle: "A nurturing home away from home for your child in Edgewater, NJ",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1920"
  },
  programs: [],
  testimonials: [],
  contact: { phone: "(201) 945-9445" }
};

export default Home;
