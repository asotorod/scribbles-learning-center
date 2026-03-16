import React, { useState } from 'react';
import api from '../../services/api';

const AdminSettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const passwordRequirements = [
    { test: (p) => p.length >= 8, label: 'At least 8 characters' },
    { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
    { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
    { test: (p) => /[0-9]/.test(p), label: 'One number' },
    { test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p), label: 'One special character' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const failedReq = passwordRequirements.find((r) => !r.test(newPassword));
    if (failedReq) {
      setMessage({ type: 'error', text: `Password must have: ${failedReq.label}` });
      return;
    }

    setLoading(true);
    try {
      await api.put('/admin/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Settings</h1>
        <p>Manage your account security settings</p>
      </div>

      <div style={{ maxWidth: 500, marginTop: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>Change Password</h3>

          {message.text && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                marginBottom: 16,
                backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                color: message.type === 'error' ? '#dc2626' : '#16a34a',
                fontSize: 14,
              }}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              />
              <div style={{ marginTop: 8 }}>
                {passwordRequirements.map((req, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: newPassword && req.test(newPassword) ? '#16a34a' : '#9ca3af',
                      marginBottom: 2,
                    }}
                  >
                    {newPassword && req.test(newPassword) ? '\u2713' : '\u2022'} {req.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
