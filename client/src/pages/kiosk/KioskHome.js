import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kioskAPI } from '../../services/api';
import './Kiosk.css';

const KioskHome = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNumberPress = useCallback((num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  }, [pin]);

  const handleClear = useCallback(() => {
    setPin('');
    setError('');
  }, []);

  const handleBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await kioskAPI.verifyPin(pin);
      const data = response.data?.data || response.data;

      if (data.type === 'parent') {
        const parent = data.parent;
        // Fetch the parent's children with check-in status
        let children = [];
        try {
          const childrenRes = await kioskAPI.getParentChildren(parent.id, pin);
          const childrenData = childrenRes.data?.data?.children;
          children = Array.isArray(childrenData) ? childrenData : [];
        } catch (childErr) {
          console.error('Error fetching children:', childErr);
        }

        navigate('/kiosk/parent', {
          state: {
            user: {
              id: parent.id,
              first_name: parent.firstName,
              last_name: parent.lastName,
            },
            children: children.map(c => ({
              id: c.id,
              first_name: c.firstName,
              last_name: c.lastName,
              photo_url: c.photoUrl,
              program: c.programName,
              status: c.status,
              check_in_time: c.checkInTime ? new Date(c.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null,
              check_out_time: c.checkOutTime ? new Date(c.checkOutTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null,
            })),
            pin,
          },
          replace: true
        });
      } else if (data.type === 'employee') {
        const employee = data.employee;
        navigate('/kiosk/employee', {
          state: {
            user: {
              id: employee.id,
              first_name: employee.firstName,
              last_name: employee.lastName,
              position: employee.position,
            },
            isClockedIn: employee.isClockedIn,
            clockInTime: employee.clockInTime,
            pin,
          },
          replace: true
        });
      }
    } catch (err) {
      console.error('PIN verification failed:', err);
      const msg = err.response?.data?.error || 'Invalid PIN. Please try again.';
      setError(msg);
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [pin, navigate]);

  // Auto-submit when 4 digits entered
  React.useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  const renderPinDots = () => {
    return (
      <div className="pin-dots">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="kiosk-container">
      <div className="kiosk-content">
        {/* Logo */}
        <div className="kiosk-logo">
          <img src="/logo.png" alt="Scribbles Learning Center" />
          <h1>Scribbles Learning Center</h1>
        </div>

        {/* PIN Entry */}
        <div className="kiosk-pin-section">
          <h2>Enter Your PIN</h2>
          <p>Parents: Check in/out your children<br/>Staff: Clock in/out</p>

          {renderPinDots()}

          {error && <div className="kiosk-error">{error}</div>}

          {/* Number Pad */}
          <div className="kiosk-numpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                className="numpad-btn"
                onClick={() => handleNumberPress(num.toString())}
                disabled={loading}
              >
                {num}
              </button>
            ))}
            <button
              className="numpad-btn numpad-clear"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </button>
            <button
              className="numpad-btn"
              onClick={() => handleNumberPress('0')}
              disabled={loading}
            >
              0
            </button>
            <button
              className="numpad-btn numpad-back"
              onClick={handleBackspace}
              disabled={loading}
            >
              ⌫
            </button>
          </div>

          {loading && (
            <div className="kiosk-loading">
              <div className="kiosk-spinner" />
              <span>Verifying...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="kiosk-demo-info">
          <p>Enter your assigned PIN to check in or clock in</p>
        </div>
      </div>

      {/* Current Time */}
      <div className="kiosk-time">
        <CurrentTime />
      </div>
    </div>
  );
};

// Current time display
const CurrentTime = () => {
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
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

export default KioskHome;
