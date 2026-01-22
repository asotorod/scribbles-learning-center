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
      const { type, user, children } = response.data.data || response.data;

      if (type === 'parent') {
        navigate('/kiosk/parent', {
          state: { user, children },
          replace: true
        });
      } else if (type === 'employee') {
        navigate('/kiosk/employee', {
          state: { user },
          replace: true
        });
      }
    } catch (err) {
      console.error('PIN verification failed:', err);
      setError('Invalid PIN. Please try again.');
      setPin('');

      // For demo, simulate successful login
      if (pin === '1234') {
        navigate('/kiosk/parent', {
          state: {
            user: { id: 1, first_name: 'Sarah', last_name: 'Johnson' },
            children: [
              { id: 1, first_name: 'Emma', last_name: 'Johnson', program: 'Preschool', status: 'not_checked_in' },
              { id: 2, first_name: 'Noah', last_name: 'Johnson', program: 'Toddler', status: 'checked_in', check_in_time: '8:32 AM' },
            ]
          },
          replace: true
        });
      } else if (pin === '5678') {
        navigate('/kiosk/employee', {
          state: {
            user: { id: 1, first_name: 'Maria', last_name: 'Garcia', position: 'Lead Teacher' },
            status: 'not_clocked_in'
          },
          replace: true
        });
      } else {
        setError('Invalid PIN. Try 1234 (parent) or 5678 (employee)');
      }
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

        {/* Demo Info */}
        <div className="kiosk-demo-info">
          <p>Demo PINs: <strong>1234</strong> (Parent) | <strong>5678</strong> (Employee)</p>
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
