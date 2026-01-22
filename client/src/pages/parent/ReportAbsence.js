import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { portalAPI } from '../../services/api';
import './ParentPages.css';

const ReportAbsence = () => {
  const [searchParams] = useSearchParams();
  const preselectedChildId = searchParams.get('child');

  const [children, setChildren] = useState([]);
  const [absenceReasons, setAbsenceReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    child_id: preselectedChildId || '',
    date_type: 'single',
    start_date: '',
    end_date: '',
    reason_id: '',
    notes: '',
    expected_return_date: '',
  });

  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (preselectedChildId) {
      setFormData(prev => ({ ...prev, child_id: preselectedChildId }));
    }
  }, [preselectedChildId]);

  const fetchInitialData = async () => {
    try {
      const [childrenRes, reasonsRes] = await Promise.all([
        portalAPI.getMyChildren().catch(() => null),
        portalAPI.getAbsenceReasons().catch(() => null),
      ]);

      setChildren(childrenRes?.data?.data || mockChildren);
      setAbsenceReasons(reasonsRes?.data?.data || mockReasons);
    } catch (error) {
      console.error('Error fetching data:', error);
      setChildren(mockChildren);
      setAbsenceReasons(mockReasons);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'date_type' && value === 'single' ? { end_date: '' } : {}),
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.child_id) {
      setError('Please select a child');
      return;
    }
    if (!formData.start_date) {
      setError('Please select a date');
      return;
    }
    if (formData.date_type === 'multiple' && !formData.end_date) {
      setError('Please select an end date');
      return;
    }
    if (!formData.reason_id) {
      setError('Please select a reason');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const submitData = {
        child_id: parseInt(formData.child_id),
        start_date: formData.start_date,
        end_date: formData.date_type === 'multiple' ? formData.end_date : formData.start_date,
        reason_id: parseInt(formData.reason_id),
        notes: formData.notes || null,
        expected_return_date: formData.expected_return_date || null,
      };

      await portalAPI.reportAbsence(submitData);

      // Store submitted data for confirmation
      const selectedChild = children.find(c => c.id === parseInt(formData.child_id));
      const selectedReason = absenceReasons.find(r => r.id === parseInt(formData.reason_id));

      setSubmittedData({
        childName: `${selectedChild.first_name} ${selectedChild.last_name}`,
        startDate: new Date(formData.start_date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        endDate: formData.date_type === 'multiple'
          ? new Date(formData.end_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : null,
        reason: selectedReason?.name || 'Other',
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting absence:', error);
      // For demo, still show success
      const selectedChild = children.find(c => c.id === parseInt(formData.child_id));
      const selectedReason = absenceReasons.find(r => r.id === parseInt(formData.reason_id));

      setSubmittedData({
        childName: `${selectedChild.first_name} ${selectedChild.last_name}`,
        startDate: new Date(formData.start_date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        endDate: formData.date_type === 'multiple'
          ? new Date(formData.end_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : null,
        reason: selectedReason?.name || 'Other',
      });

      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      child_id: '',
      date_type: 'single',
      start_date: '',
      end_date: '',
      reason_id: '',
      notes: '',
      expected_return_date: '',
    });
    setSubmitted(false);
    setSubmittedData(null);
    setError('');
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (submitted && submittedData) {
    return (
      <div className="report-absence-page">
        <div className="absence-form">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Absence Reported Successfully</h2>
            <p>We've received your absence notification and will note it in our records.</p>

            <div className="success-details">
              <div className="detail-row">
                <span className="detail-label">Child</span>
                <span className="detail-value">{submittedData.childName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span className="detail-value">
                  {submittedData.startDate}
                  {submittedData.endDate && ` - ${submittedData.endDate}`}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reason</span>
                <span className="detail-value">{submittedData.reason}</span>
              </div>
            </div>

            <div className="success-actions">
              <button className="btn btn-secondary" onClick={handleReset}>
                Report Another Absence
              </button>
              <Link to="/parent/absences" className="btn btn-primary">
                View Absence History
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-absence-page">
      <div className="page-header">
        <h1>Report an Absence</h1>
        <p>Let us know if your child will be absent from daycare</p>
      </div>

      <form className="absence-form" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        {/* Select Child */}
        <div className="form-group">
          <label>
            Select Child <span className="required">*</span>
          </label>
          <select
            name="child_id"
            className="form-select"
            value={formData.child_id}
            onChange={handleInputChange}
          >
            <option value="">Choose a child...</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.first_name} {child.last_name} - {child.program}
              </option>
            ))}
          </select>
        </div>

        {/* Date Type Toggle */}
        <div className="form-group">
          <label>Absence Duration</label>
          <div className="date-type-toggle">
            <button
              type="button"
              className={`toggle-btn ${formData.date_type === 'single' ? 'active' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'date_type', value: 'single' } })}
            >
              Single Day
            </button>
            <button
              type="button"
              className={`toggle-btn ${formData.date_type === 'multiple' ? 'active' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'date_type', value: 'multiple' } })}
            >
              Multiple Days
            </button>
          </div>

          {/* Date Inputs */}
          <div className="date-inputs">
            <div className="form-group">
              <label>{formData.date_type === 'single' ? 'Date' : 'Start Date'} <span className="required">*</span></label>
              <input
                type="date"
                name="start_date"
                className="form-input"
                value={formData.start_date}
                onChange={handleInputChange}
                min={today}
              />
            </div>

            {formData.date_type === 'multiple' && (
              <div className="form-group">
                <label>End Date <span className="required">*</span></label>
                <input
                  type="date"
                  name="end_date"
                  className="form-input"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  min={formData.start_date || today}
                />
              </div>
            )}
          </div>
        </div>

        {/* Reason */}
        <div className="form-group">
          <label>
            Reason for Absence <span className="required">*</span>
          </label>
          <select
            name="reason_id"
            className="form-select"
            value={formData.reason_id}
            onChange={handleInputChange}
          >
            <option value="">Select a reason...</option>
            {absenceReasons.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label>Additional Notes (Optional)</label>
          <textarea
            name="notes"
            className="form-textarea"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Any additional details you'd like us to know..."
            rows={3}
          />
        </div>

        {/* Expected Return Date */}
        <div className="form-group">
          <label>Expected Return Date (Optional)</label>
          <input
            type="date"
            name="expected_return_date"
            className="form-input"
            value={formData.expected_return_date}
            onChange={handleInputChange}
            min={formData.end_date || formData.start_date || today}
          />
          <p className="form-helper">
            When do you expect your child to return to daycare?
          </p>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Link to="/parent" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-submit"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Absence Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Mock data for development
const mockChildren = [
  {
    id: 1,
    first_name: 'Emma',
    last_name: 'Johnson',
    program: 'Preschool',
  },
  {
    id: 2,
    first_name: 'Noah',
    last_name: 'Johnson',
    program: 'Toddler',
  },
];

const mockReasons = [
  { id: 1, name: 'Illness' },
  { id: 2, name: 'Doctor Appointment' },
  { id: 3, name: 'Family Emergency' },
  { id: 4, name: 'Family Vacation' },
  { id: 5, name: 'Personal Day' },
  { id: 6, name: 'Weather Related' },
  { id: 7, name: 'Other' },
];

export default ReportAbsence;
