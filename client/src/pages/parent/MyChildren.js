import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { portalAPI } from '../../services/api';
import { compressImage, validateImageFile, ACCEPTED_IMAGE_TYPES } from '../../utils/imageUtils';
import PhotoConsentModal from '../../components/PhotoConsentModal';
import './ParentPages.css';

const MyChildren = () => {
  const [children, setChildren] = useState([]);
  const [expandedChild, setExpandedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // child id currently uploading
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [pendingPhotoChild, setPendingPhotoChild] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await portalAPI.getMyChildren();
      const childrenRaw = response?.data?.data?.children;
      const childrenData = Array.isArray(childrenRaw) ? childrenRaw.map(c => ({
        id: c.id,
        first_name: c.firstName || c.first_name || '',
        last_name: c.lastName || c.last_name || '',
        photo_url: c.photoUrl || c.photo_url || null,
        program: c.programName || c.program_name || c.program || '',
        date_of_birth: c.dateOfBirth || c.date_of_birth || '',
        enrollment_date: c.enrollmentDate || c.enrollment_date || '',
        allergies: c.allergies || '',
        medical_notes: c.medicalNotes || c.medical_notes || '',
        emergency_contact_name: c.emergencyContactName || c.emergency_contact_name || '',
        emergency_contact_phone: c.emergencyContactPhone || c.emergency_contact_phone || '',
        photo_consent_given: c.photoConsentGiven || c.photo_consent_given || false,
        photo_consent_date: c.photoConsentDate || c.photo_consent_date || null,
      })) : [];
      setChildren(childrenData.length > 0 ? childrenData : []);
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (childId) => {
    if (uploading) return;

    const child = children.find(c => c.id === childId);
    if (!child) return;

    // Check if consent has been given
    if (!child.photo_consent_given) {
      // Show consent modal
      setPendingPhotoChild(child);
      setConsentModalOpen(true);
    } else {
      // Consent already given, proceed to file picker
      fileInputRefs.current[childId]?.click();
    }
  };

  const handleConsentAgree = async () => {
    if (!pendingPhotoChild) return;

    setConsentLoading(true);
    try {
      // Record consent via API
      await portalAPI.givePhotoConsent(pendingPhotoChild.id);

      // Update local state
      setChildren(prev =>
        prev.map(c => c.id === pendingPhotoChild.id
          ? { ...c, photo_consent_given: true, photo_consent_date: new Date().toISOString() }
          : c
        )
      );

      // Close modal and trigger file picker
      setConsentModalOpen(false);

      // Small delay to allow modal to close before opening file picker
      setTimeout(() => {
        fileInputRefs.current[pendingPhotoChild.id]?.click();
        setPendingPhotoChild(null);
      }, 100);
    } catch (error) {
      console.error('Error recording consent:', error);
      alert('Failed to record consent. Please try again.');
    } finally {
      setConsentLoading(false);
    }
  };

  const handleConsentClose = () => {
    setConsentModalOpen(false);
    setPendingPhotoChild(null);
  };

  const handlePhotoChange = async (e, childId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so same file can be re-selected
    e.target.value = '';

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(childId);
    try {
      const compressed = await compressImage(file);
      const response = await portalAPI.uploadChildPhoto(childId, compressed);
      const newUrl = response.data?.data?.photoUrl;

      if (newUrl) {
        setChildren(prev =>
          prev.map(c => c.id === childId ? { ...c, photo_url: newUrl } : c)
        );
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      alert(err.response?.data?.error || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(null);
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
              <div
                className={`child-avatar child-avatar-clickable ${uploading === child.id ? 'child-avatar-uploading' : ''}`}
                onClick={() => handlePhotoClick(child.id)}
                title={child.photo_url ? 'Change photo' : 'Add photo'}
              >
                {uploading === child.id ? (
                  <div className="avatar-spinner" />
                ) : child.photo_url ? (
                  <>
                    <img src={child.photo_url} alt={child.first_name} />
                    <div className="avatar-edit-overlay">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="avatar-add-photo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span>Add Photo</span>
                  </div>
                )}
                <input
                  ref={(el) => (fileInputRefs.current[child.id] = el)}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoChange(e, child.id)}
                />
              </div>
              <div className="child-header-info">
                <h3>{child.first_name} {child.last_name}</h3>
                <p>{child.program}</p>
                {child.photo_consent_given && child.photo_consent_date && (
                  <span className="photo-consent-status given">
                    Photo consent given on {new Date(child.photo_consent_date).toLocaleDateString()}
                  </span>
                )}
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
                  {/* Emergency Contact */}
                  {(child.emergency_contact_name || child.emergency_contact_phone) && (
                    <div className="details-section">
                      <h4>Emergency Contact</h4>
                      <div className="emergency-contact">
                        <div>
                          <span className="contact-name">{child.emergency_contact_name || 'N/A'}</span>
                        </div>
                        {child.emergency_contact_phone && (
                          <div className="contact-phone">{child.emergency_contact_phone}</div>
                        )}
                      </div>
                    </div>
                  )}

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
                    <span>&#9650;</span> Show Less
                  </>
                ) : (
                  <>
                    <span>&#9660;</span> Show More Details
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

      <PhotoConsentModal
        isOpen={consentModalOpen}
        onClose={handleConsentClose}
        onAgree={handleConsentAgree}
        childName={pendingPhotoChild ? `${pendingPhotoChild.first_name} ${pendingPhotoChild.last_name}` : ''}
        loading={consentLoading}
      />
    </div>
  );
};

export default MyChildren;
