import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { portalAPI } from '../../services/api';
import './ParentPages.css';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [upcomingAbsences, setUpcomingAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [childrenRes, absencesRes] = await Promise.all([
        portalAPI.getMyChildren().catch(() => null),
        portalAPI.getAbsences().catch(() => null),
      ]);

      const childrenRaw = childrenRes?.data?.data?.children;
      const childrenData = Array.isArray(childrenRaw) ? childrenRaw.map(c => ({
        id: c.id,
        first_name: c.firstName || c.first_name || '',
        last_name: c.lastName || c.last_name || '',
        photo_url: c.photoUrl || c.photo_url || null,
        program: c.programName || c.program_name || c.program || '',
        status: c.status || 'not_checked_in',
        check_in_time: c.checkInTime || c.check_in_time || null,
        check_out_time: c.checkOutTime || c.check_out_time || null,
      })) : [];
      setChildren(childrenData);

      const absencesData = absencesRes?.data?.data?.absences;
      const absences = Array.isArray(absencesData) ? absencesData : [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setUpcomingAbsences(
        absences.filter(a => {
          const startDate = new Date(a.start_date);
          return startDate >= today && a.status !== 'cancelled';
        }).slice(0, 3)
      );
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (child) => {
    if (child.status === 'checked_in') {
      return {
        text: `Checked in at ${child.check_in_time}`,
        className: 'status-present'
      };
    }
    if (child.status === 'checked_out') {
      return {
        text: `Checked out at ${child.check_out_time}`,
        className: 'status-gone'
      };
    }
    return {
      text: 'Not checked in yet',
      className: 'status-pending'
    };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
    <div className="parent-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-text">
          <h1>{getGreeting()}, {user?.firstName || user?.first_name || user?.name || 'there'}!</h1>
          <p>Here's what's happening with your family today.</p>
        </div>
        <Link to="/parent/report-absence" className="btn-primary-large">
          <span>📝</span> Report an Absence
        </Link>
      </div>

      {/* Children Status Cards */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Today's Status</h2>
          <Link to="/parent/children" className="section-link">View All</Link>
        </div>

        <div className="children-status-grid">
          {(children || []).map((child) => {
            const status = getStatusDisplay(child);
            return (
              <div key={child.id} className="child-status-card">
                <div className="child-avatar">
                  {child.photo_url ? (
                    <img src={child.photo_url} alt={child.first_name} />
                  ) : (
                    <span>{(child.first_name || '?').charAt(0)}</span>
                  )}
                </div>
                <div className="child-details">
                  <h3>{child.first_name} {child.last_name}</h3>
                  <p className="child-program">{child.program}</p>
                  <div className={`status-badge ${status.className}`}>
                    {status.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/parent/report-absence" className="action-card primary">
            <span className="action-icon">📝</span>
            <div className="action-text">
              <h3>Report Absence</h3>
              <p>Let us know if your child will be absent</p>
            </div>
          </Link>
          <Link to="/parent/absences" className="action-card">
            <span className="action-icon">📅</span>
            <div className="action-text">
              <h3>Absence History</h3>
              <p>View past and upcoming absences</p>
            </div>
          </Link>
          <Link to="/parent/children" className="action-card">
            <span className="action-icon">👶</span>
            <div className="action-text">
              <h3>My Children</h3>
              <p>View child profiles and details</p>
            </div>
          </Link>
          <Link to="/parent/account" className="action-card">
            <span className="action-icon">⚙️</span>
            <div className="action-text">
              <h3>My Account</h3>
              <p>Update your contact information</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Upcoming Absences */}
      {upcomingAbsences.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Upcoming Absences</h2>
            <Link to="/parent/absences" className="section-link">View All</Link>
          </div>

          <div className="absences-list">
            {(upcomingAbsences || []).map((absence) => (
              <div key={absence.id} className="absence-card">
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
                  {absence.end_date && absence.end_date !== absence.start_date && (
                    <span className="absence-range">
                      Through {new Date(absence.end_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className={`absence-status status-${absence.status}`}>
                  {absence.status === 'pending' ? 'Pending' : 'Confirmed'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ParentDashboard;
