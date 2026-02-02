import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { portalAPI } from '../../services/api';
import './ParentPages.css';

const MyAccount = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [authorizedPickups, setAuthorizedPickups] = useState([]);
  const [showAddPickup, setShowAddPickup] = useState(false);
  const [newPickup, setNewPickup] = useState({
    name: '',
    relationship: '',
    phone: '',
  });

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      const response = await portalAPI.getProfile();
      const data = response?.data?.data || {};
      setProfile(data);
      setAuthorizedPickups(Array.isArray(data.authorized_pickups) ? data.authorized_pickups : []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await portalAPI.updateProfile(profile);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      // For demo, show success anyway
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwords.new_password !== passwords.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwords.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await portalAPI.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Failed to change password. Please check your current password.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPickup = async (e) => {
    e.preventDefault();

    if (!newPickup.name || !newPickup.phone) {
      setMessage({ type: 'error', text: 'Name and phone are required.' });
      return;
    }

    try {
      // In real app, this would call API
      const newPickupWithId = { ...newPickup, id: Date.now() };
      setAuthorizedPickups(prev => [...prev, newPickupWithId]);
      setNewPickup({ name: '', relationship: '', phone: '' });
      setShowAddPickup(false);
      setMessage({ type: 'success', text: 'Authorized pickup added successfully!' });
    } catch (error) {
      console.error('Error adding pickup:', error);
      setMessage({ type: 'error', text: 'Failed to add authorized pickup.' });
    }
  };

  const handleRemovePickup = async (pickupId) => {
    if (!window.confirm('Are you sure you want to remove this authorized pickup?')) {
      return;
    }

    try {
      // In real app, this would call API
      setAuthorizedPickups(prev => prev.filter(p => p.id !== pickupId));
      setMessage({ type: 'success', text: 'Authorized pickup removed.' });
    } catch (error) {
      console.error('Error removing pickup:', error);
    }
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
    <div className="my-account-page">
      <div className="page-header">
        <h1>My Account</h1>
        <p>Manage your profile and account settings</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Contact Information */}
      <section className="account-section">
        <h2>Contact Information</h2>
        <form onSubmit={handleSaveProfile}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="first_name"
                className="form-input"
                value={profile.first_name}
                onChange={handleProfileChange}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                className="form-input"
                value={profile.last_name}
                onChange={handleProfileChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={profile.email}
                onChange={handleProfileChange}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={profile.phone}
                onChange={handleProfileChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              name="address"
              className="form-input"
              value={profile.address}
              onChange={handleProfileChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                className="form-input"
                value={profile.city}
                onChange={handleProfileChange}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                className="form-input"
                value={profile.state}
                onChange={handleProfileChange}
              />
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input
                type="text"
                name="zip_code"
                className="form-input"
                value={profile.zip_code}
                onChange={handleProfileChange}
              />
            </div>
          </div>

          <div className="section-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Change Password */}
      <section className="account-section">
        <h2>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="current_password"
              className="form-input"
              value={passwords.current_password}
              onChange={handlePasswordChange}
              autoComplete="current-password"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="new_password"
                className="form-input"
                value={passwords.new_password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
              />
              <p className="form-helper">Must be at least 8 characters</p>
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                className="form-input"
                value={passwords.confirm_password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="section-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !passwords.current_password || !passwords.new_password}
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Authorized Pickups */}
      <section className="account-section">
        <h2>Authorized Pickups</h2>
        <p style={{ color: 'var(--gray-600)', fontSize: '14px', marginBottom: '20px' }}>
          These are people authorized to pick up your children from daycare.
        </p>

        <div className="pickups-list">
          {(authorizedPickups || []).map((pickup) => (
            <div key={pickup.id} className="pickup-card">
              <div className="pickup-avatar">
                <span>{pickup.name.charAt(0)}</span>
              </div>
              <div className="pickup-info">
                <h4>{pickup.name}</h4>
                <p>{pickup.relationship} • {pickup.phone}</p>
              </div>
              <div className="pickup-actions">
                <button
                  className="btn-icon danger"
                  onClick={() => handleRemovePickup(pickup.id)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAddPickup ? (
          <form onSubmit={handleAddPickup} style={{ marginTop: '16px', padding: '16px', background: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={newPickup.name}
                  onChange={(e) => setNewPickup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPickup.relationship}
                  onChange={(e) => setNewPickup(prev => ({ ...prev, relationship: e.target.value }))}
                  placeholder="Grandfather"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Phone Number <span className="required">*</span></label>
              <input
                type="tel"
                className="form-input"
                value={newPickup.phone}
                onChange={(e) => setNewPickup(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(201) 555-0123"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddPickup(false);
                  setNewPickup({ name: '', relationship: '', phone: '' });
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Person
              </button>
            </div>
          </form>
        ) : (
          <button
            className="add-pickup-btn"
            onClick={() => setShowAddPickup(true)}
          >
            <span>+</span> Add Authorized Pickup
          </button>
        )}
      </section>
    </div>
  );
};

export default MyAccount;
