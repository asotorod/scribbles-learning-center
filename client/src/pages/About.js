import React from 'react';
import Hero from '../components/Hero';
import './About.css';

// Static content - no API needed for demo
const about = {
  title: "About Scribbles Learning Center",
  subtitle: "Nurturing Young Minds Since 2010",
  story: "Scribbles Learning Center is a family-owned childcare facility dedicated to providing a safe, loving, and educational environment for children. With over 15 years of experience caring for the children of Edgewater and surrounding communities, we've become a trusted partner for hundreds of families.",
  mission: "Our mission is to create a nurturing home away from home where every child can learn, grow, and thrive. We believe every child is unique and deserves individualized attention to reach their full potential.",
  values: [
    { id: 1, title: "Safety First", description: "Video-monitored rooms and secure entry systems keep your child protected." },
    { id: 2, title: "Family Atmosphere", description: "We treat every child as if they were our own family member." },
    { id: 3, title: "Quality Education", description: "Curriculum aligned with NJ Preschool Teaching & Learning Standards." },
    { id: 4, title: "Flexibility", description: "Part-time and full-time schedules to meet your family's needs." }
  ]
};

const staff = [
  {
    id: 1,
    name: "Maria Rodriguez",
    role: "Director & Founder",
    bio: "With over 20 years in early childhood education, Maria founded Scribbles to create the loving environment she always envisioned for children.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
    credentials: ["CDA Certified", "CPR/First Aid"]
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Lead Preschool Teacher",
    bio: "Sarah brings creativity and enthusiasm to our preschool classroom, preparing children for kindergarten success.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
    credentials: ["B.A. Early Childhood", "NJ Certified"]
  },
  {
    id: 3,
    name: "Emily Chen",
    role: "Infant Room Supervisor",
    bio: "Emily's gentle approach and expertise in infant development make her a favorite among our youngest learners and their families.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    credentials: ["Infant/Toddler CDA", "CPR/First Aid"]
  }
];

const About = () => {
  return (
    <main>
      <Hero
        title="About Us"
        subtitle="Learn about our story, mission, and the dedicated team behind Scribbles"
        backgroundImage="https://plus.unsplash.com/premium_photo-1681842152160-cb5e5d470ddd?q=80&w=2456&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        size="medium"
        ctaPrimary="Schedule a Tour"
        ctaPrimaryLink="/contact"
      />

      {/* Our Story */}
      <section className="section">
        <div className="container">
          <div className="about-story">
            <div className="about-story-content">
              <h2>{about.title}</h2>
              <p className="story-subtitle">{about.subtitle}</p>
              <p>{about.story}</p>
              <p>{about.mission}</p>
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

      {/* Our Values */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header">
            <h2>Our Values</h2>
            <p>The principles that guide everything we do</p>
          </div>
          <div className="values-grid">
            {about.values.map((value) => (
              <div key={value.id} className="value-card">
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Our Team */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Meet Our Team</h2>
            <p>Dedicated educators who love what they do</p>
          </div>
          <div className="staff-grid">
            {staff.map((member) => (
              <div key={member.id} className="staff-card">
                <div className="staff-image">
                  <img src={member.image} alt={member.name} />
                </div>
                <div className="staff-info">
                  <h3>{member.name}</h3>
                  <p className="staff-role">{member.role}</p>
                  <p className="staff-bio">{member.bio}</p>
                  <div className="staff-credentials">
                    {member.credentials.map((cred, i) => (
                      <span key={i} className="credential-badge">{cred}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="section section-primary">
        <div className="container">
          <div className="certifications">
            <div className="certification-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <h3>Licensed by NJ DCPP</h3>
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
              <p>Family-run since 2010</p>
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
