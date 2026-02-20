import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { programsAPI, contentAPI } from '../services/api';
import './Home.css';

// Default programs data using design system colors
const defaultPrograms = [
  {
    id: 1,
    name: "Infant Care",
    slug: "infant",
    age_range: "0–18 months",
    short_description: "A gentle, nurturing environment for your baby's first experiences with learning.",
    image_url: "https://plus.unsplash.com/premium_photo-1679288660582-3cc3d3c65bb8?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#E79897" // Peony
  },
  {
    id: 2,
    name: "Toddler Program",
    slug: "toddler",
    age_range: "18–30 months",
    short_description: "Active exploration and discovery for curious toddlers!",
    image_url: "https://images.unsplash.com/photo-1501686637-b7aa9c48a882?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#C6C09C" // Pistachio
  },
  {
    id: 3,
    name: "Preschool",
    slug: "preschool",
    age_range: "2 & 3 years",
    short_description: "Kindergarten readiness through play-based learning.",
    image_url: "https://plus.unsplash.com/premium_photo-1684291228086-4fd45b967992?q=80&w=2342&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#FCC88A" // Honey
  },
  {
    id: 4,
    name: "Pre-Kindergarten",
    slug: "pre-k",
    age_range: "4–5 years",
    short_description: "Preparing children for kindergarten success with structured learning.",
    image_url: "https://images.unsplash.com/photo-1588075592446-265fd1e6e76f?q=80&w=2344&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#768E78" // Fern
  },
  {
    id: 5,
    name: "Summer Camp",
    slug: "summer-camp",
    age_range: "Up to 5 years",
    short_description: "Fun-filled summer adventures with learning and outdoor activities.",
    image_url: "https://plus.unsplash.com/premium_photo-1723874432108-5057464ddd8f?q=80&w=2412&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    color: "#768E78" // Fern
  }
];

const defaultTestimonials = [
  {
    id: 1,
    content: "It is a family run daycare and they are very flexible and accommodating to any special request for your child.",
    author_name: "Happy Parent",
    rating: 5
  },
  {
    id: 2,
    content: "They showed our son so much care, love, and attention, which was shown in his development and peacefulness when we dropped him off.",
    author_name: "Grateful Family",
    rating: 5
  },
  {
    id: 3,
    content: "My family has become a part of their family and learning community. Their love and care cannot be beat!",
    author_name: "Scribbles Mom",
    rating: 5
  }
];

const features = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    title: "Curriculum-Based Learning",
    description: "Creative Curriculum with HighScope approach aligned with NJ Preschool Standards.",
    color: "#E79897" // Peony
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    title: "Dual-Language Instruction",
    description: "English and Spanish instruction integrated throughout our curriculum.",
    color: "#C6C09C" // Pistachio
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: "Lower Staff Ratios",
    description: "1:3 for infants and 1:5 for toddlers — better than NJ requirements.",
    color: "#FCC88A" // Honey
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Safe & Secure",
    description: "Video-monitored rooms and secure entry systems for your peace of mind.",
    color: "#768E78" // Fern
  }
];

const Home = () => {
  const [programs, setPrograms] = useState(defaultPrograms);
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const fetchData = async () => {
    try {
      const [programsRes, testimonialsRes] = await Promise.all([
        programsAPI.getAll().catch(() => null),
        contentAPI.getSection('testimonials').catch(() => null),
      ]);

      const apiPrograms = programsRes?.data?.data?.programs;
      if (Array.isArray(apiPrograms) && apiPrograms.length > 0) {
        // Merge API data with defaults to ensure images and colors are present
        const mergedPrograms = apiPrograms.map(apiProg => {
          const defaultProg = defaultPrograms.find(d => d.slug === apiProg.slug || d.id === apiProg.id);
          return {
            ...defaultProg,
            ...apiProg,
            image_url: apiProg.image_url || defaultProg?.image_url,
            color: apiProg.color || defaultProg?.color,
          };
        });
        // Include any default programs not in API (e.g. newly added)
        const apiSlugs = apiPrograms.map(p => p.slug);
        const missingDefaults = defaultPrograms.filter(d => !apiSlugs.includes(d.slug));
        setPrograms([...mergedPrograms, ...missingDefaults].sort((a, b) => (a.id || a.sortOrder || 0) - (b.id || b.sortOrder || 0)));
      }
      const testimonials = testimonialsRes?.data?.data?.testimonials;
      if (Array.isArray(testimonials)) {
        setTestimonials(testimonials);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <main>
      <Hero
        title="Where Little Minds Grow Big"
        subtitle="A dual-language early learning center with curriculum-based education in Edgewater, NJ"
        backgroundImage="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2244&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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
            <p>An early learning center, not just childcare</p>
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
            {(programs || []).map((program) => (
              <Link to={`/programs#${program.slug}`} key={program.id} className="program-card">
                <div className="program-image">
                  <img src={program.image_url} alt={program.name} />
                  <div className="program-badge" style={{ background: program.color }}>
                    {program.age_range}
                  </div>
                </div>
                <div className="program-content">
                  <h3>{program.name}</h3>
                  <p>{program.short_description}</p>
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

      {/* Testimonials Carousel */}
      <section className="section section-primary">
        <div className="container">
          <div className="section-header light">
            <h2>What Parents Say</h2>
            <p>Real stories from our Scribbles family</p>
          </div>
          <div className="testimonials-carousel">
            <div className="testimonial-main">
              <div className="testimonial-stars">
                {'★'.repeat(testimonials[activeTestimonial]?.rating || 5)}
              </div>
              <blockquote>"{testimonials[activeTestimonial]?.content}"</blockquote>
              <p className="testimonial-author">— {testimonials[activeTestimonial]?.author_name}</p>
            </div>
            <div className="testimonial-dots">
              {(testimonials || []).map((_, index) => (
                <button
                  key={index}
                  className={`testimonial-dot ${index === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="testimonials-grid">
            {(testimonials || []).map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-stars">
                  {'★'.repeat(testimonial.rating)}
                </div>
                <blockquote>"{testimonial.content}"</blockquote>
                <p className="testimonial-author">— {testimonial.author_name}</p>
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

export default Home;
