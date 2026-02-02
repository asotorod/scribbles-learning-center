import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { kioskAPI } from '../../services/api';
import './Kiosk.css';

const INACTIVITY_TIMEOUT = 30000; // 30 seconds

const KioskEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isClockedIn, clockInTime: initialClockInTime, pin } = location.state || {};

  const [clockedIn, setClockedIn] = useState(isClockedIn || false);
  const [clockInTime, setClockInTime] = useState(initialClockInTime ? new Date(initialClockInTime) : null);
  const [hoursWorked, setHoursWorked] = useState('0:00');
  const [loading, setLoading] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showConfirm, setShowConfirm] = useState(null);

  // Redirect if no user data
  useEffect(() => {
    if (!user) {
      navigate('/kiosk', { replace: true });
    }
  }, [user, navigate]);

  // Auto-logout on inactivity
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        navigate('/kiosk', { replace: true });
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [lastActivity, navigate]);

  // Update hours worked when clocked in
  useEffect(() => {
    if (!clockedIn || !clockInTime) return;

    const updateHours = () => {
      const now = new Date();
      const diff = now - clockInTime;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setHoursWorked(`${hours}:${minutes.toString().padStart(2, '0')}`);
    };

    updateHours();
    const timer = setInterval(updateHours, 60000);
    return () => clearInterval(timer);
  }, [clockedIn, clockInTime]);

  // Reset activity timer on any interaction
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'touchstart', 'keydown'];
    events.forEach(event => document.addEventListener(event, resetActivity));
    return () => {
      events.forEach(event => document.removeEventListener(event, resetActivity));
    };
  }, [resetActivity]);

  const handleClockIn = async () => {
    setLoading(true);

    try {
      await kioskAPI.employeeClockIn({
        employeeId: user.id,
        pin,
      });

      // Update local state on success
      const now = new Date();
      setClockInTime(now);
      setClockedIn(true);
      setShowConfirm('clockin');
      setTimeout(() => setShowConfirm(null), 3000);
    } catch (error) {
      console.error('Clock-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);

    try {
      await kioskAPI.employeeClockOut({
        employeeId: user.id,
        pin,
      });

      // Update local state on success
      setClockedIn(false);
      setShowConfirm('clockout');
      setTimeout(() => {
        setShowConfirm(null);
        navigate('/kiosk', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Clock-out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    navigate('/kiosk', { replace: true });
  };

  const formatClockTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="kiosk-container" onClick={resetActivity}>
      {/* Confirmation Toast */}
      {showConfirm && (
        <div className={`kiosk-toast ${showConfirm}`}>
          <span className="toast-icon">
            {showConfirm === 'clockin' ? '✅' : '👋'}
          </span>
          <span>
            {showConfirm === 'clockin'
              ? 'You have clocked in!'
              : 'You have clocked out. See you next time!'}
          </span>
        </div>
      )}

      <div className="kiosk-content kiosk-employee">
        {/* Header */}
        <div className="kiosk-header">
          <div className="kiosk-welcome">
            <h1>Welcome, {user.first_name}!</h1>
            <p>{user.position || 'Staff Member'}</p>
          </div>
          <button className="kiosk-done-btn" onClick={handleDone}>
            Done
          </button>
        </div>

        {/* Clock Status Card */}
        <div className="kiosk-clock-card">
          <div className="clock-status-section">
            <div className={`clock-status-indicator ${clockedIn ? 'active' : 'inactive'}`}>
              <span className="status-icon">{clockedIn ? '⏱️' : '🏠'}</span>
              <div className="status-text">
                <h2>{clockedIn ? 'Currently Working' : 'Not Clocked In'}</h2>
                {clockedIn && clockInTime && (
                  <p>Clocked in at {formatClockTime(clockInTime)}</p>
                )}
              </div>
            </div>

            {clockedIn && (
              <div className="hours-worked">
                <span className="hours-label">Hours Today</span>
                <span className="hours-value">{hoursWorked}</span>
              </div>
            )}
          </div>

          <div className="clock-action-section">
            {!clockedIn ? (
              <button
                className="kiosk-btn kiosk-btn-large kiosk-btn-primary"
                onClick={handleClockIn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🕐</span>
                    CLOCK IN
                  </>
                )}
              </button>
            ) : (
              <button
                className="kiosk-btn kiosk-btn-large kiosk-btn-secondary"
                onClick={handleClockOut}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">👋</span>
                    CLOCK OUT
                  </>
                )}
              </button>
            )}
          </div>

          {/* Today's Summary */}
          <div className="clock-summary">
            <h3>Today's Schedule</h3>
            <div className="summary-row">
              <span>Shift</span>
              <span>8:00 AM - 5:00 PM</span>
            </div>
            <div className="summary-row">
              <span>Break</span>
              <span>12:00 PM - 1:00 PM</span>
            </div>
          </div>
        </div>

        {/* Inactivity Warning */}
        <div className="kiosk-footer">
          <p>This screen will automatically close after 30 seconds of inactivity</p>
        </div>
      </div>

      {/* Current Time */}
      <div className="kiosk-time">
        <CurrentTime />
      </div>
    </div>
  );
};

const CurrentTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="time-display">
      <span className="time-value">
        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
      </span>
      <span className="date-value">
        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </span>
    </div>
  );
};

export default KioskEmployee;
