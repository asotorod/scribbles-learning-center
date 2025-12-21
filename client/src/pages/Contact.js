import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import { contentAPI, inquiryAPI } from '../services/api';
import './Contact.css';

const Contact = () => {
  const [contact, setContact] = useState(null);
  const [formData, setFormData] = useState({
    parentName: '',
    email: '',
    phone: '',
    childName: '',
    childAge: '',
    program: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await contentAPI.getSection('contact');
        setContact(response.data);
      } catch (error) {
        console.error('Error fetching contact:', error);
        setContact(defaultContact);
      }
    };
    fetchContact();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await inquiryAPI.submit(formData);
      setSubmitted(true);
      setFormData({
        parentName: '',
        email: '',
        phone: '',
        childName: '',
        childAge: '',
        program: '',
        message: ''
      });
    } catch (error) {
      setError('There was an error submitting your inquiry. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const info = contact || defaultContact;

  return (
    <main>
      <Hero
        title="Contact Us"
        subtitle="We'd love to hear from you! Schedule a tour or ask us a question."
        backgroundImage="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1920"
        size="medium"
        ctaPrimary="Call Now"
        ctaPrimaryLink={`tel:${info.phone}`}
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
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  {error && <div className="form-error">{error}</div>}
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="parentName">Your Name *</label>
                      <input
                        type="text"
                        id="parentName"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="form-row">
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
                    <div className="form-group">
                      <label htmlFor="program">Program Interest</label>
                      <select
                        id="program"
                        name="program"
                        value={formData.program}
                        onChange={handleChange}
                      >
                        <option value="">Select a program</option>
                        <option value="infant">Infant Care (6 weeks - 18 months)</option>
                        <option value="toddler">Toddler Program (18 months - 3 years)</option>
                        <option value="preschool">Preschool (3 - 5 years)</option>
                        <option value="after-school">After School Care (5 - 12 years)</option>
                        <option value="general">General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="childName">Child's Name</label>
                      <input
                        type="text"
                        id="childName"
                        name="childName"
                        value={formData.childName}
                        onChange={handleChange}
                        placeholder="Enter child's name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="childAge">Child's Age</label>
                      <input
                        type="text"
                        id="childAge"
                        name="childAge"
                        value={formData.childAge}
                        onChange={handleChange}
                        placeholder="e.g., 2 years"
                      />
                    </div>
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
                      placeholder="Tell us about your childcare needs..."
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submitting}>
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
                    <p>{info.address}</p>
                    <p>{info.city}, {info.state} {info.zip}</p>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Call Us</h3>
                <div className="info-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                  </svg>
                  <a href={`tel:${info.phone}`}>{info.phone}</a>
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
                    <p><strong>Mon - Fri:</strong> {info.hours?.weekdays}</p>
                    <p><strong>Sat - Sun:</strong> {info.hours?.saturday}</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="map-container">
                <iframe
                  title="Scribbles Learning Center Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3020.1234567890123!2d-73.97123456789012!3d40.82123456789012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ5JzE2LjQiTiA3M8KwNTgnMTYuNCJX!5e0!3m2!1sen!2sus!4v1234567890123"
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
    </main>
  );
};

const defaultContact = {
  address: "725 River Rd, Suite 103",
  city: "Edgewater",
  state: "NJ",
  zip: "07020",
  phone: "(201) 945-9445",
  hours: {
    weekdays: "7:30 AM - 6:30 PM",
    saturday: "Closed"
  }
};

export default Contact;
