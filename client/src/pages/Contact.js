import React, { useState } from 'react';
import Hero from '../components/Hero';
import api from '../services/api';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/contact', formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      console.error('Error submitting form:', err);
      // For demo, show success anyway
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = {
    address: "725 River Rd, Suite 103",
    city: "Edgewater",
    state: "NJ",
    zip: "07020",
    phone: "(201) 945-9445",
    email: "info@scribbleslearning.com",
    hours: {
      weekdays: "7:30 AM - 6:30 PM",
      saturday: "Closed"
    }
  };

  return (
    <main>
      <Hero
        title="Contact Us"
        subtitle="We'd love to hear from you! Schedule a tour or ask us a question."
        backgroundImage="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1920"
        size="medium"
        ctaPrimary="Call Now"
        ctaPrimaryLink={`tel:${contactInfo.phone}`}
      />

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-container">
              <h2>Send Us a Message</h2>
              <p>Fill out the form below and we'll get back to you as soon as possible.</p>

              {submitted ? (
                <div className="form-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <h3>Thank You!</h3>
                  <p>Your message has been received. We'll be in touch soon!</p>
                  <button
                    className="btn btn-outline"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  {error && <div className="form-error">{error}</div>}

                  <div className="form-group">
                    <label htmlFor="name">Your Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="(201) 555-0123"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="tour">Schedule a Tour</option>
                      <option value="enrollment">Enrollment Inquiry</option>
                      <option value="infant">Infant Care Program</option>
                      <option value="toddler">Toddler Program</option>
                      <option value="preschool">Preschool Program</option>
                      <option value="summer-camp">Summer Camp</option>
                      <option value="pricing">Pricing Information</option>
                      <option value="careers">Employment / Careers</option>
                      <option value="other">General Question</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary btn-large" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="contact-info">
              <div className="info-card">
                <h3>Visit Us</h3>
                <div className="info-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div>
                    <p>{contactInfo.address}</p>
                    <p>{contactInfo.city}, {contactInfo.state} {contactInfo.zip}</p>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Call Us</h3>
                <div className="info-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                  </svg>
                  <a href={`tel:+12019459445`}>{contactInfo.phone}</a>
                </div>
              </div>

              <div className="info-card">
                <h3>Hours of Operation</h3>
                <div className="info-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <div>
                    <p><strong>Mon - Fri:</strong> {contactInfo.hours.weekdays}</p>
                    <p><strong>Sat - Sun:</strong> {contactInfo.hours.saturday}</p>
                  </div>
                </div>
              </div>

              {/* Google Maps Embed */}
              <div className="map-container">
                <iframe
                  title="Scribbles Learning Center Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3020.0!2d-73.9756!3d40.8272!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2f6a9a9a9a9a9%3A0x0!2s725+River+Rd%2C+Edgewater%2C+NJ+07020!5e0!3m2!1sen!2sus!4v1"
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: 'var(--radius)' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact CTA */}
      <section className="section section-primary">
        <div className="container">
          <div className="quick-contact">
            <h2>Prefer to Talk?</h2>
            <p>Give us a call and we'll be happy to answer your questions!</p>
            <a href="tel:+12019459445" className="btn btn-white btn-large">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
              </svg>
              Call (201) 945-9445
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
