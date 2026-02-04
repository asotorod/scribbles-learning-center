import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { kioskAPI } from '../../services/api';
import './Kiosk.css';

const INACTIVITY_TIMEOUT = 30000; // 30 seconds

const KioskParent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, children: initialChildren, pin } = location.state || {};

  const [children, setChildren] = useState(initialChildren || []);
  const [loading, setLoading] = useState({});
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

  const handleCheckIn = async (child) => {
    setLoading(prev => ({ ...prev, [child.id]: true }));

    try {
      await kioskAPI.checkIn({
        parentId: user.id,
        childIds: [child.id],
        pin,
      });

      // Update local state on success
      const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setChildren(prev => prev.map(c =>
        c.id === child.id
          ? { ...c, status: 'checked_in', check_in_time: now }
          : c
      ));
      setShowConfirm({ type: 'checkin', child });
      setTimeout(() => setShowConfirm(null), 3000);
    } catch (error) {
      console.error('Check-in error:', error);
    } finally {
      setLoading(prev => ({ ...prev, [child.id]: false }));
    }
  };

  const handleCheckOut = async (child) => {
    setLoading(prev => ({ ...prev, [child.id]: true }));

    try {
      await kioskAPI.checkOut({
        parentId: user.id,
        childIds: [child.id],
        pin,
      });

      // Update local state on success
      const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setChildren(prev => prev.map(c =>
        c.id === child.id
          ? { ...c, status: 'checked_out', check_out_time: now }
          : c
      ));
      setShowConfirm({ type: 'checkout', child });
      setTimeout(() => setShowConfirm(null), 3000);
    } catch (error) {
      console.error('Check-out error:', error);
    } finally {
      setLoading(prev => ({ ...prev, [child.id]: false }));
    }
  };

  const handleDone = () => {
    navigate('/kiosk', { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="kiosk-container" onClick={resetActivity}>
      {/* Confirmation Toast */}
      {showConfirm && (
        <div className={`kiosk-toast ${showConfirm.type}`}>
          <span className="toast-icon">
            {showConfirm.type === 'checkin' ? '✅' : '👋'}
          </span>
          <span>
            {showConfirm.child.first_name} has been {showConfirm.type === 'checkin' ? 'checked in' : 'checked out'}!
          </span>
        </div>
      )}

      <div className="kiosk-content kiosk-parent">
        {/* Header */}
        <div className="kiosk-header">
          <div className="kiosk-welcome">
            <h1>Welcome, {user.first_name}!</h1>
            <p>Select a child to check in or out</p>
          </div>
          <button className="kiosk-done-btn" onClick={handleDone}>
            Done
          </button>
        </div>

        {/* Children Cards */}
        <div className="kiosk-children-grid">
          {children.map(child => (
            <div key={child.id} className="kiosk-child-card">
              <div className="child-photo">
                {child.photo_url ? (
                  <img src={child.photo_url} alt={child.first_name} />
                ) : (
                  <span>{child.first_name.charAt(0)}</span>
                )}
              </div>

              <div className="child-info">
                <h3>{child.first_name} {child.last_name}</h3>
                <p className="child-program">{child.program}</p>
                <div className={`child-status status-${child.status}`}>
                  {child.status === 'checked_in' && (
                    <>
                      <span className="status-dot"></span>
                      Checked in at {child.check_in_time}
                    </>
                  )}
                  {child.status === 'checked_out' && (
                    <>
                      <span className="status-dot"></span>
                      Checked out at {child.check_out_time}
                    </>
                  )}
                  {child.status === 'not_checked_in' && (
                    <>
                      <span className="status-dot"></span>
                      Not checked in
                    </>
                  )}
                </div>
              </div>

              {child.authorizedPickups && child.authorizedPickups.length > 0 && (
                <div className="kiosk-pickups">
                  <span className="kiosk-pickups-label">Authorized Pickups:</span>
                  {child.authorizedPickups.map((p) => (
                    <span key={p.id} className="kiosk-pickup-tag">
                      {p.name}{p.relationship ? ` (${p.relationship})` : ''}
                    </span>
                  ))}
                </div>
              )}

              <div className="child-actions">
                {child.status === 'not_checked_in' && (
                  <button
                    className="kiosk-btn kiosk-btn-primary"
                    onClick={() => handleCheckIn(child)}
                    disabled={loading[child.id]}
                  >
                    {loading[child.id] ? 'Processing...' : 'CHECK IN'}
                  </button>
                )}
                {child.status === 'checked_in' && (
                  <button
                    className="kiosk-btn kiosk-btn-secondary"
                    onClick={() => handleCheckOut(child)}
                    disabled={loading[child.id]}
                  >
                    {loading[child.id] ? 'Processing...' : 'CHECK OUT'}
                  </button>
                )}
                {child.status === 'checked_out' && (
                  <div className="child-complete">
                    <span>✓ Complete for today</span>
                  </div>
                )}
              </div>
            </div>
          ))}
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

export default KioskParent;
