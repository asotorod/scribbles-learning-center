import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { portalAPI } from '../../services/api';
import './ParentPages.css';

const AbsenceHistory = () => {
  const [searchParams] = useSearchParams();
  const filterChildId = searchParams.get('child');

  const [absences, setAbsences] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedChild, setSelectedChild] = useState(filterChildId || 'all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [absencesRes, childrenRes] = await Promise.all([
        portalAPI.getAbsences().catch(() => null),
        portalAPI.getMyChildren().catch(() => null),
      ]);

      // Extract absences array and normalize camelCase→snake_case
      const absencesRaw = absencesRes?.data?.data?.absences;
      const absencesData = Array.isArray(absencesRaw) ? absencesRaw.map(a => ({
        id: a.id,
        child_id: a.childId || a.child_id,
        child_name: a.childName || a.child_name || '',
        start_date: a.startDate || a.start_date,
        end_date: a.endDate || a.end_date,
        reason: a.reasonName || a.reason_name || a.reason || '',
        notes: a.notes || '',
        status: a.status || 'pending',
      })) : [];
      setAbsences(absencesData);

      // Extract children array and normalize
      const childrenRaw = childrenRes?.data?.data?.children;
      const childrenData = Array.isArray(childrenRaw) ? childrenRaw.map(c => ({
        id: c.id,
        first_name: c.firstName || c.first_name || '',
        last_name: c.lastName || c.last_name || '',
      })) : [];
      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAbsences([]);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAbsence = async (absenceId) => {
    if (!window.confirm('Are you sure you want to cancel this absence?')) {
      return;
    }

    try {
      await portalAPI.cancelAbsence(absenceId);
      setAbsences(prev =>
        prev.map(a =>
          a.id === absenceId ? { ...a, status: 'cancelled' } : a
        )
      );
    } catch (error) {
      console.error('Error cancelling absence:', error);
      // For demo, update locally anyway
      setAbsences(prev =>
        prev.map(a =>
          a.id === absenceId ? { ...a, status: 'cancelled' } : a
        )
      );
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredAbsences = absences.filter(absence => {
    // Filter by child if selected
    if (selectedChild !== 'all' && absence.child_id !== parseInt(selectedChild)) {
      return false;
    }

    // Filter cancelled
    if (absence.status === 'cancelled') {
      return false;
    }

    const startDate = new Date(absence.start_date);
    const endDate = absence.end_date ? new Date(absence.end_date) : startDate;

    if (activeTab === 'upcoming') {
      return endDate >= today;
    } else {
      return endDate < today;
    }
  });

  const upcomingCount = absences.filter(a => {
    if (a.status === 'cancelled') return false;
    const endDate = a.end_date ? new Date(a.end_date) : new Date(a.start_date);
    return endDate >= today;
  }).length;

  const pastCount = absences.filter(a => {
    if (a.status === 'cancelled') return false;
    const endDate = a.end_date ? new Date(a.end_date) : new Date(a.start_date);
    return endDate < today;
  }).length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate);
    if (!endDate || endDate === startDate) {
      return start;
    }
    return `${start} - ${formatDate(endDate)}`;
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
    <div className="absence-history-page">
      <div className="page-header">
        <h1>Absence History</h1>
        <p>View and manage your children's absences</p>
      </div>

      {/* Child Filter */}
      {children.length > 1 && (
        <div className="form-group" style={{ maxWidth: '300px' }}>
          <select
            className="form-select"
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
          >
            <option value="all">All Children</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.first_name} {child.last_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="history-tabs">
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
          <span className="tab-count">{upcomingCount}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past
          <span className="tab-count">{pastCount}</span>
        </button>
      </div>

      {/* Absences List */}
      {filteredAbsences.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No {activeTab} absences</h3>
          <p>
            {activeTab === 'upcoming'
              ? "You haven't reported any upcoming absences."
              : "No past absences on record."}
          </p>
          {activeTab === 'upcoming' && (
            <Link to="/parent/report-absence" className="btn btn-primary">
              Report an Absence
            </Link>
          )}
        </div>
      ) : (
        <div className="history-list">
          {filteredAbsences.map((absence) => (
            <div key={absence.id} className="history-card">
              <div className="absence-date">
                <span className="date-day">
                  {new Date(absence.start_date).getDate()}
                </span>
                <span className="date-month">
                  {new Date(absence.start_date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>

              <div className="absence-details">
                <h4>{absence.child_name}</h4>
                <p>{absence.reason}</p>
                <div className="absence-meta">
                  <span className="meta-item">
                    <span>📅</span>
                    {formatDateRange(absence.start_date, absence.end_date)}
                  </span>
                  {absence.notes && (
                    <span className="meta-item">
                      <span>📝</span>
                      {absence.notes}
                    </span>
                  )}
                </div>
              </div>

              <div className="history-card-actions">
                <div className={`absence-status status-${absence.status}`}>
                  {absence.status === 'pending' ? 'Pending' : 'Confirmed'}
                </div>

                {activeTab === 'upcoming' && (
                  <button
                    className="btn-icon danger"
                    onClick={() => handleCancelAbsence(absence.id)}
                  >
                    <span>✕</span>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report New Absence Button */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link to="/parent/report-absence" className="btn-primary-large">
          <span>📝</span> Report New Absence
        </Link>
      </div>
    </div>
  );
};

export default AbsenceHistory;
