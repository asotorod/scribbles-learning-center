import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { portalAPI } from '../../services/api';
import './ParentPages.css';

const MyChildren = () => {
  const [children, setChildren] = useState([]);
  const [expandedChild, setExpandedChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await portalAPI.getMyChildren();
      setChildren(response?.data?.data || mockChildren);
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren(mockChildren);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (childId) => {
    setExpandedChild(expandedChild === childId ? null : childId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} years old`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="my-children-page">
      <div className="page-header">
        <h1>My Children</h1>
        <p>View your children's profiles and information</p>
      </div>

      <div className="children-grid">
        {children.map((child) => (
          <div key={child.id} className="child-card">
            <div className="child-card-header">
              <div className="child-avatar">
                {child.photo_url ? (
                  <img src={child.photo_url} alt={child.first_name} />
                ) : (
                  <span>{child.first_name.charAt(0)}</span>
                )}
              </div>
              <div className="child-header-info">
                <h3>{child.first_name} {child.last_name}</h3>
                <p>{child.program}</p>
              </div>
            </div>

            <div className="child-card-body">
              <div className="child-info-grid">
                <div className="info-item">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value">{formatDate(child.date_of_birth)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Age</span>
                  <span className="info-value">{calculateAge(child.date_of_birth)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Classroom</span>
                  <span className="info-value">{child.classroom || 'Assigned'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Enrolled Since</span>
                  <span className="info-value">{formatDate(child.enrollment_date)}</span>
                </div>
              </div>

              {expandedChild === child.id && (
                <div className="child-expanded-details">
                  {/* Emergency Contacts */}
                  <div className="details-section">
                    <h4>Emergency Contacts</h4>
                    {(child.emergency_contacts || mockEmergencyContacts).map((contact, idx) => (
                      <div key={idx} className="emergency-contact">
                        <div>
                          <span className="contact-name">{contact.name}</span>
                          <span className="contact-relation">({contact.relationship})</span>
                        </div>
                        <div className="contact-phone">{contact.phone}</div>
                      </div>
                    ))}
                  </div>

                  {/* Medical Information */}
                  {(child.allergies || child.medical_notes) && (
                    <div className="details-section">
                      <h4>Medical Information</h4>
                      <div className="medical-notes">
                        {child.allergies && (
                          <p><strong>Allergies:</strong> {child.allergies}</p>
                        )}
                        {child.medical_notes && (
                          <p><strong>Notes:</strong> {child.medical_notes}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dietary Restrictions */}
                  {child.dietary_restrictions && (
                    <div className="details-section">
                      <h4>Dietary Restrictions</h4>
                      <div className="dietary-notes">
                        {child.dietary_restrictions}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className="expand-btn"
                onClick={() => toggleExpanded(child.id)}
              >
                {expandedChild === child.id ? (
                  <>
                    <span>▲</span> Show Less
                  </>
                ) : (
                  <>
                    <span>▼</span> Show More Details
                  </>
                )}
              </button>

              <div className="child-card-actions">
                <Link
                  to={`/parent/report-absence?child=${child.id}`}
                  className="btn btn-primary"
                >
                  Report Absence
                </Link>
                <Link
                  to={`/parent/absences?child=${child.id}`}
                  className="btn btn-outline"
                >
                  View Absences
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mock data for development
const mockChildren = [
  {
    id: 1,
    first_name: 'Emma',
    last_name: 'Johnson',
    program: 'Preschool Program',
    date_of_birth: '2020-03-15',
    classroom: 'Sunshine Room',
    enrollment_date: '2023-09-01',
    allergies: 'Peanuts',
    medical_notes: 'Uses inhaler for mild asthma',
    dietary_restrictions: 'No peanuts or tree nuts',
    photo_url: null,
  },
  {
    id: 2,
    first_name: 'Noah',
    last_name: 'Johnson',
    program: 'Toddler Program',
    date_of_birth: '2022-08-22',
    classroom: 'Rainbow Room',
    enrollment_date: '2024-01-15',
    allergies: null,
    medical_notes: null,
    dietary_restrictions: null,
    photo_url: null,
  },
];

const mockEmergencyContacts = [
  {
    name: 'Sarah Johnson',
    relationship: 'Mother',
    phone: '(201) 555-0123',
  },
  {
    name: 'Michael Johnson',
    relationship: 'Father',
    phone: '(201) 555-0124',
  },
  {
    name: 'Linda Smith',
    relationship: 'Grandmother',
    phone: '(201) 555-0125',
  },
];

export default MyChildren;
