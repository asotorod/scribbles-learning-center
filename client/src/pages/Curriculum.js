import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './Curriculum.css';

const Curriculum = () => {
  return (
    <main>
      <Hero
        title="Our Curriculum"
        subtitle="A comprehensive, dual-language approach to early childhood education"
        backgroundImage="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920"
        size="medium"
        ctaPrimary="Schedule a Tour"
        ctaPrimaryLink="/contact"
      />

      {/* Curriculum Intro */}
      <section className="section">
        <div className="container">
          <div className="curriculum-intro">
            <h2>An Early Learning Center, Not Just Childcare</h2>
            <p>
              At Scribbles Learning Center, we are an <strong>early learning facility</strong> with
              curriculum implemented from infancy through pre-kindergarten. Our approach combines
              proven educational frameworks with a nurturing environment, preparing children for
              academic success while fostering their natural curiosity and love of learning.
            </p>
          </div>
        </div>
      </section>

      {/* Dual Language Section */}
      <section className="section section-cream">
        <div className="container">
          <div className="dual-language-section">
            <div className="dual-language-content">
              <div className="section-badge" style={{ background: '#768E78' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h2>Dual-Language Learning Center</h2>
              <p className="subtitle">English and Spanish instruction throughout our curriculum</p>
              <p>
                We are a <strong>dual-language learning center</strong>, with instruction implemented
                in both English and Spanish as part of our everyday curriculum. Research shows that
                bilingual exposure in early childhood enhances cognitive development, improves
                problem-solving skills, and provides children with valuable language skills for the future.
              </p>
              <div className="language-benefits">
                <div className="language-benefit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>Daily Spanish vocabulary and phrases</span>
                </div>
                <div className="language-benefit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>Bilingual songs and stories</span>
                </div>
                <div className="language-benefit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>Cultural awareness activities</span>
                </div>
                <div className="language-benefit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>Enhanced cognitive development</span>
                </div>
              </div>
            </div>
            <div className="dual-language-image">
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"
                alt="Children learning in classroom"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Framework */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Our Curriculum Framework</h2>
            <p>Research-based approaches tailored to each developmental stage</p>
          </div>
          <div className="framework-grid">
            <div className="framework-card">
              <div className="framework-icon" style={{ background: '#E79897' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h3>Creative Curriculum</h3>
              <p>
                A comprehensive, research-based curriculum that features exploration and discovery
                as a way of learning. It is designed to help educators at all levels of experience
                plan and implement a developmentally appropriate program.
              </p>
            </div>
            <div className="framework-card">
              <div className="framework-icon" style={{ background: '#C6C09C' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <h3>HighScope Approach</h3>
              <p>
                Children are active learners who learn best through activities they plan and carry
                out themselves. Our teachers guide children through active learning experiences
                with key developmental indicators.
              </p>
            </div>
            <div className="framework-card">
              <div className="framework-icon" style={{ background: '#FCC88A' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>NJ Preschool Standards</h3>
              <p>
                Our curriculum is aligned with the New Jersey Preschool Teaching and Learning
                Standards, ensuring children are prepared for kindergarten and beyond with
                age-appropriate skill development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum for Every Age */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header">
            <h2>Curriculum for Every Age</h2>
            <p>Developmentally appropriate learning from infancy through Pre-K</p>
          </div>
          <div className="framework-grid">
            <div className="framework-card">
              <div className="framework-icon" style={{ background: '#E79897' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a5 5 0 0 1 5 5c0 2-1 3-2 4l-3 3-3-3c-1-1-2-2-2-4a5 5 0 0 1 5-5z"/>
                  <circle cx="12" cy="6" r="1.5"/>
                  <path d="M8 14c-3 0-5 2-5 4v2h18v-2c0-2-2-4-5-4"/>
                </svg>
              </div>
              <h3>Birth to 3 Years</h3>
              <p className="framework-subtitle">Infants & Toddlers</p>
              <p>
                Based on Creative Curriculum for Infants, Toddlers & Twos, aligned with NJ Birth to
                Three Early Learning Standards. Focus on sensory exploration, language development,
                and secure attachments.
              </p>
            </div>
            <div className="framework-card">
              <div className="framework-icon" style={{ background: '#C6C09C' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="8" width="6" height="12" rx="1"/>
                  <rect x="9" y="4" width="6" height="16" rx="1"/>
                  <rect x="15" y="10" width="6" height="10" rx="1"/>
                </svg>
              </div>
              <h3>Preschool</h3>
              <p className="framework-subtitle">2 & 3 Years</p>
              <p>
                Creative Curriculum with HighScope approach. Hands-on learning, problem-solving,
                and early literacy through play-based social skill development.
              </p>
            </div>
            <div className="framework-card">
              <div className="framework-icon" style={{ background: '#768E78' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/>
                </svg>
              </div>
              <h3>Pre-Kindergarten</h3>
              <p className="framework-subtitle">4–5 Years</p>
              <p>
                Kindergarten readiness program aligned with NJ Preschool Teaching & Learning Standards.
                Early reading, writing, math, and independence skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Domains */}
      <section className="section section-primary">
        <div className="container">
          <div className="section-header light">
            <h2>Learning Domains</h2>
            <p>Developing the whole child across all areas</p>
          </div>
          <div className="domains-grid">
            <div className="domain-card">
              <div className="domain-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h3>Language & Literacy</h3>
              <ul>
                <li>Pre-reading and early writing skills</li>
                <li>Vocabulary development in English and Spanish</li>
                <li>Phonological awareness</li>
                <li>Book appreciation and storytelling</li>
              </ul>
            </div>
            <div className="domain-card">
              <div className="domain-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>Math & Logic</h3>
              <ul>
                <li>Number recognition and counting</li>
                <li>Patterns and sorting</li>
                <li>Shapes and spatial awareness</li>
                <li>Problem-solving skills</li>
              </ul>
            </div>
            <div className="domain-card">
              <div className="domain-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                  <path d="M2 12h20"/>
                </svg>
              </div>
              <h3>Science & Discovery</h3>
              <ul>
                <li>STEM activities and experiments</li>
                <li>Nature exploration</li>
                <li>Cause and effect understanding</li>
                <li>Scientific inquiry methods</li>
              </ul>
            </div>
            <div className="domain-card">
              <div className="domain-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h3>Social-Emotional</h3>
              <ul>
                <li>Self-regulation and emotional awareness</li>
                <li>Cooperation and sharing</li>
                <li>Conflict resolution</li>
                <li>Building friendships</li>
              </ul>
            </div>
            <div className="domain-card">
              <div className="domain-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <h3>Creative Arts</h3>
              <ul>
                <li>Art exploration and expression</li>
                <li>Music and movement</li>
                <li>Dramatic play</li>
                <li>Creative problem-solving</li>
              </ul>
            </div>
            <div className="domain-card">
              <div className="domain-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                  <line x1="6" y1="1" x2="6" y2="4"/>
                  <line x1="10" y1="1" x2="10" y2="4"/>
                  <line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
              </div>
              <h3>Physical Development</h3>
              <ul>
                <li>Gross motor skills (running, jumping, climbing)</li>
                <li>Fine motor skills (writing, cutting, building)</li>
                <li>Health and nutrition awareness</li>
                <li>Outdoor play and exploration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Age-Specific Curriculum */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Age-Appropriate Learning</h2>
            <p>Curriculum tailored to each developmental stage</p>
          </div>
          <div className="age-curriculum-grid">
            <div className="age-curriculum-card">
              <div className="age-header" style={{ background: '#E79897' }}>
                <h3>Infants</h3>
                <span className="age-range">0–18 months</span>
              </div>
              <div className="age-content">
                <p>Our infant curriculum focuses on sensory development and secure attachments.</p>
                <ul>
                  <li>Tummy time and motor development</li>
                  <li>Sensory exploration activities</li>
                  <li>Early language exposure (English & Spanish)</li>
                  <li>Music and gentle movement</li>
                  <li>Safe sleep practices (AAP guidelines)</li>
                </ul>
                <div className="ratio-badge">1:3 Teacher Ratio</div>
              </div>
            </div>
            <div className="age-curriculum-card">
              <div className="age-header" style={{ background: '#C6C09C' }}>
                <h3>Toddlers</h3>
                <span className="age-range">18–30 months</span>
              </div>
              <div className="age-content">
                <p>Toddlers learn through active exploration and structured play activities.</p>
                <ul>
                  <li>Language-rich environment</li>
                  <li>Potty training support</li>
                  <li>Social skill development</li>
                  <li>Art, music, and movement</li>
                  <li>Daily outdoor playground time</li>
                </ul>
                <div className="ratio-badge">1:5 Teacher Ratio</div>
              </div>
            </div>
            <div className="age-curriculum-card">
              <div className="age-header" style={{ background: '#FCC88A' }}>
                <h3>Preschool</h3>
                <span className="age-range">2 & 3 years</span>
              </div>
              <div className="age-content">
                <p>Separate classes for 2s and 3s with age-appropriate curriculum and activities.</p>
                <ul>
                  <li>Creative Curriculum with HighScope</li>
                  <li>Pre-reading and early writing</li>
                  <li>STEM activities and experiments</li>
                  <li>Dual-language instruction</li>
                  <li>Aligned with NJ Preschool Standards</li>
                </ul>
                <div className="ratio-badge">1:10 Teacher Ratio</div>
              </div>
            </div>
            <div className="age-curriculum-card">
              <div className="age-header" style={{ background: '#768E78' }}>
                <h3>Pre-Kindergarten</h3>
                <span className="age-range">4–5 years</span>
              </div>
              <div className="age-content">
                <p>Comprehensive kindergarten readiness through our curriculum-based approach.</p>
                <ul>
                  <li>Kindergarten readiness curriculum</li>
                  <li>Advanced literacy and math concepts</li>
                  <li>Science experiments and discovery</li>
                  <li>Creative arts and dramatic play</li>
                  <li>Kindergarten readiness assessment</li>
                </ul>
                <div className="ratio-badge">1:10 Teacher Ratio</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Schedule */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header">
            <h2>A Day at Scribbles</h2>
            <p>Structured routines balanced with play and exploration</p>
          </div>
          <div className="schedule-grid">
            <div className="schedule-item">
              <div className="schedule-time">7:30 - 8:30</div>
              <div className="schedule-activity">
                <h4>Arrival & Free Play</h4>
                <p>Greeting, breakfast, and choice activities</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">8:30 - 9:00</div>
              <div className="schedule-activity">
                <h4>Circle Time</h4>
                <p>Morning songs, calendar, and daily theme introduction</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">9:00 - 10:00</div>
              <div className="schedule-activity">
                <h4>Learning Centers</h4>
                <p>Hands-on activities in literacy, math, science, and art</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">10:00 - 10:30</div>
              <div className="schedule-activity">
                <h4>Snack Time</h4>
                <p>Healthy snack and socialization</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">10:30 - 11:30</div>
              <div className="schedule-activity">
                <h4>Outdoor Play</h4>
                <p>Playground time and gross motor activities</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">11:30 - 12:30</div>
              <div className="schedule-activity">
                <h4>Lunch</h4>
                <p>Family-style dining and conversation</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">12:30 - 2:30</div>
              <div className="schedule-activity">
                <h4>Rest Time</h4>
                <p>Nap or quiet activities</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">2:30 - 3:00</div>
              <div className="schedule-activity">
                <h4>Snack Time</h4>
                <p>Afternoon snack</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">3:00 - 4:00</div>
              <div className="schedule-activity">
                <h4>Afternoon Activities</h4>
                <p>Music, movement, Spanish instruction, and enrichment</p>
              </div>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">4:00 - 6:30</div>
              <div className="schedule-activity">
                <h4>Free Play & Departure</h4>
                <p>Choice activities and gradual pick-up</p>
              </div>
            </div>
          </div>
          <p className="schedule-note">
            * Schedule varies by age group. Infants follow individual schedules for feeding and sleeping.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-primary">
        <div className="container">
          <div className="curriculum-cta">
            <h2>See Our Curriculum in Action</h2>
            <p>Schedule a tour to observe our classrooms and meet our teachers</p>
            <div className="cta-buttons">
              <Link to="/contact" className="btn btn-white">Schedule a Tour</Link>
              <Link to="/programs" className="btn btn-outline-white">View Programs</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Curriculum;
