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
    first_name: '', last_name: '', email: '', phone: '',
    address: '', city: '', state: '', zip_code: '',
  });

  const [passwords, setPasswords] = useState({
    current_password: '', new_password: '', confirm_password: '',
  });

  // Per-child data: pickups and emergency contacts
  const [childrenData, setChildrenData] = useState([]);

  // Add/edit form state
  const [addingPickupFor, setAddingPickupFor] = useState(null);
  const [editingPickup, setEditingPickup] = useState(null);
  const [pickupForm, setPickupForm] = useState({ name: '', relationship: '', phone: '' });

  const [addingContactFor, setAddingContactFor] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', relationship: '', phone: '', is_primary: false });

  const [savingItem, setSavingItem] = useState(null);

  useEffect(() => { fetchAccountData(); }, []);

  const fetchAccountData = async () => {
    try {
      const response = await portalAPI.getProfile();
      const data = response?.data?.data || {};
      setProfile({
        first_name: data.first_name || data.firstName || '',
        last_name: data.last_name || data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || data.zipCode || '',
      });

      const kids = Array.isArray(data.children) ? data.children : [];
      const childrenWithData = await Promise.all(
        kids.map(async (child) => {
          const childId = child.id;
          const [pickupsRes, contactsRes] = await Promise.all([
            portalAPI.getAuthorizedPickups(childId).catch(() => ({ data: { data: { pickups: [] } } })),
            portalAPI.getEmergencyContacts(childId).catch(() => ({ data: { data: { contacts: [] } } })),
          ]);

          return {
            id: childId,
            firstName: child.first_name || child.firstName || '',
            lastName: child.last_name || child.lastName || '',
            authorizedPickups: pickupsRes?.data?.data?.pickups || [],
            emergencyContacts: contactsRes?.data?.data?.contacts || [],
          };
        })
      );
      setChildrenData(childrenWithData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // === Profile ===
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await portalAPI.updateProfile(profile);
      showMsg('success', 'Profile updated successfully!');
    } catch {
      showMsg('error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // === Password ===
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      return showMsg('error', 'New passwords do not match.');
    }
    if (passwords.new_password.length < 8) {
      return showMsg('error', 'Password must be at least 8 characters.');
    }
    setSaving(true);
    try {
      await portalAPI.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      showMsg('success', 'Password changed successfully!');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch {
      showMsg('error', 'Failed to change password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  // === Authorized Pickups ===
  const handleAddPickup = (childId) => {
    setAddingPickupFor(childId);
    setEditingPickup(null);
    setPickupForm({ name: '', relationship: '', phone: '' });
  };

  const handleEditPickup = (childId, pickup) => {
    setEditingPickup({ childId, pickupId: pickup.id });
    setAddingPickupFor(null);
    setPickupForm({ name: pickup.name, relationship: pickup.relationship || '', phone: pickup.phone || '' });
  };

  const handleCancelPickupForm = () => {
    setAddingPickupFor(null);
    setEditingPickup(null);
    setPickupForm({ name: '', relationship: '', phone: '' });
  };

  const handleSavePickup = async (e, childId) => {
    e.preventDefault();
    if (!pickupForm.name || !pickupForm.phone) {
      return showMsg('error', 'Name and phone are required.');
    }
    setSavingItem('pickup');
    try {
      if (editingPickup) {
        await portalAPI.updateAuthorizedPickup(editingPickup.childId, editingPickup.pickupId, pickupForm);
        showMsg('success', 'Authorized pickup updated!');
      } else {
        await portalAPI.createAuthorizedPickup(childId, pickupForm);
        showMsg('success', 'Authorized pickup added!');
      }
      handleCancelPickupForm();
      await fetchAccountData();
    } catch {
      showMsg('error', 'Failed to save authorized pickup.');
    } finally {
      setSavingItem(null);
    }
  };

  const handleRemovePickup = async (childId, pickupId) => {
    if (!window.confirm('Remove this authorized pickup?')) return;
    try {
      await portalAPI.deleteAuthorizedPickup(childId, pickupId);
      showMsg('success', 'Authorized pickup removed.');
      await fetchAccountData();
    } catch {
      showMsg('error', 'Failed to remove authorized pickup.');
    }
  };

  // === Emergency Contacts ===
  const handleAddContact = (childId) => {
    setAddingContactFor(childId);
    setEditingContact(null);
    setContactForm({ name: '', relationship: '', phone: '', is_primary: false });
  };

  const handleEditContact = (childId, contact) => {
    setEditingContact({ childId, contactId: contact.id });
    setAddingContactFor(null);
    setContactForm({
      name: contact.name,
      relationship: contact.relationship || '',
      phone: contact.phone || '',
      is_primary: contact.isPrimary || false,
    });
  };

  const handleCancelContactForm = () => {
    setAddingContactFor(null);
    setEditingContact(null);
    setContactForm({ name: '', relationship: '', phone: '', is_primary: false });
  };

  const handleSaveContact = async (e, childId) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) {
      return showMsg('error', 'Name and phone are required.');
    }
    setSavingItem('contact');
    try {
      if (editingContact) {
        await portalAPI.updateEmergencyContactEntry(editingContact.childId, editingContact.contactId, contactForm);
        showMsg('success', 'Emergency contact updated!');
      } else {
        await portalAPI.createEmergencyContact(childId, contactForm);
        showMsg('success', 'Emergency contact added!');
      }
      handleCancelContactForm();
      await fetchAccountData();
    } catch {
      showMsg('error', 'Failed to save emergency contact.');
    } finally {
      setSavingItem(null);
    }
  };

  const handleRemoveContact = async (childId, contactId) => {
    if (!window.confirm('Delete this emergency contact?')) return;
    try {
      await portalAPI.deleteEmergencyContact(childId, contactId);
      showMsg('success', 'Emergency contact deleted.');
      await fetchAccountData();
    } catch {
      showMsg('error', 'Failed to delete emergency contact.');
    }
  };

  // Inline form component for pickup/contact
  const renderPickupForm = (childId) => (
    <form onSubmit={(e) => handleSavePickup(e, childId)} className="inline-form">
      <div className="form-row">
        <div className="form-group">
          <label>Full Name <span className="required">*</span></label>
          <input type="text" className="form-input" value={pickupForm.name}
            onChange={(e) => setPickupForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Smith" />
        </div>
        <div className="form-group">
          <label>Relationship</label>
          <input type="text" className="form-input" value={pickupForm.relationship}
            onChange={(e) => setPickupForm(prev => ({ ...prev, relationship: e.target.value }))}
            placeholder="Grandfather" />
        </div>
      </div>
      <div className="form-group">
        <label>Phone Number <span className="required">*</span></label>
        <input type="tel" className="form-input" value={pickupForm.phone}
          onChange={(e) => setPickupForm(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="(201) 555-0123" />
      </div>
      <div className="inline-form-actions">
        <button type="button" className="btn btn-secondary" onClick={handleCancelPickupForm}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={savingItem === 'pickup'}>
          {savingItem === 'pickup' ? 'Saving...' : (editingPickup ? 'Update' : 'Add Person')}
        </button>
      </div>
    </form>
  );

  const renderContactForm = (childId) => (
    <form onSubmit={(e) => handleSaveContact(e, childId)} className="inline-form">
      <div className="form-row">
        <div className="form-group">
          <label>Full Name <span className="required">*</span></label>
          <input type="text" className="form-input" value={contactForm.name}
            onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Jane Doe" />
        </div>
        <div className="form-group">
          <label>Relationship</label>
          <input type="text" className="form-input" value={contactForm.relationship}
            onChange={(e) => setContactForm(prev => ({ ...prev, relationship: e.target.value }))}
            placeholder="Aunt" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Phone Number <span className="required">*</span></label>
          <input type="tel" className="form-input" value={contactForm.phone}
            onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="(201) 555-0123" />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
            <input type="checkbox" checked={contactForm.is_primary}
              onChange={(e) => setContactForm(prev => ({ ...prev, is_primary: e.target.checked }))} />
            Primary contact
          </label>
        </div>
      </div>
      <div className="inline-form-actions">
        <button type="button" className="btn btn-secondary" onClick={handleCancelContactForm}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={savingItem === 'contact'}>
          {savingItem === 'contact' ? 'Saving...' : (editingContact ? 'Update' : 'Add Contact')}
        </button>
      </div>
    </form>
  );

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
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Contact Information */}
      <section className="account-section">
        <h2>Contact Information</h2>
        <form onSubmit={handleSaveProfile}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" name="first_name" className="form-input" value={profile.first_name} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="last_name" className="form-input" value={profile.last_name} onChange={handleProfileChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" className="form-input" value={profile.email} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" className="form-input" value={profile.phone} onChange={handleProfileChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Street Address</label>
            <input type="text" name="address" className="form-input" value={profile.address} onChange={handleProfileChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input type="text" name="city" className="form-input" value={profile.city} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label>State</label>
              <input type="text" name="state" className="form-input" value={profile.state} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input type="text" name="zip_code" className="form-input" value={profile.zip_code} onChange={handleProfileChange} />
            </div>
          </div>
          <div className="section-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Emergency Contacts - Per Child */}
      {childrenData.map((child) => (
        <section key={`contacts-${child.id}`} className="account-section">
          <h2>Emergency Contacts for {child.firstName} {child.lastName}</h2>
          <p className="section-description">
            Emergency contacts for {child.firstName}. The primary contact will be called first.
          </p>

          {child.emergencyContacts.length > 0 ? (
            <div className="entry-list">
              {child.emergencyContacts.map((contact) => (
                <div key={contact.id} className="entry-card">
                  <div className="entry-avatar">
                    <span>{contact.name.charAt(0)}</span>
                  </div>
                  <div className="entry-info">
                    <div className="entry-name">
                      {contact.name}
                      {contact.isPrimary && <span className="badge-primary">Primary</span>}
                    </div>
                    <div className="entry-details">
                      {contact.relationship && <span>{contact.relationship}</span>}
                      {contact.relationship && contact.phone && <span> &bull; </span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>
                  <div className="entry-actions">
                    <button className="btn-icon" onClick={() => handleEditContact(child.id, contact)} title="Edit">&#9998;</button>
                    <button className="btn-icon danger" onClick={() => handleRemoveContact(child.id, contact.id)} title="Delete">&times;</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No emergency contacts added yet.</p>
          )}

          {(editingContact && editingContact.childId === child.id) && renderContactForm(child.id)}

          {addingContactFor === child.id ? (
            renderContactForm(child.id)
          ) : (
            !editingContact || editingContact.childId !== child.id ? (
              <button className="add-entry-btn" onClick={() => handleAddContact(child.id)}>
                <span>+</span> Add Emergency Contact
              </button>
            ) : null
          )}
        </section>
      ))}

      {/* Authorized Pickups - Per Child */}
      {childrenData.map((child) => (
        <section key={`pickups-${child.id}`} className="account-section">
          <h2>Authorized Pickups for {child.firstName} {child.lastName}</h2>
          <p className="section-description">
            People authorized to pick up {child.firstName} from daycare.
          </p>

          {child.authorizedPickups.length > 0 ? (
            <div className="entry-list">
              {child.authorizedPickups.map((pickup) => (
                <div key={pickup.id} className="entry-card">
                  <div className="entry-avatar">
                    <span>{pickup.name.charAt(0)}</span>
                  </div>
                  <div className="entry-info">
                    <div className="entry-name">{pickup.name}</div>
                    <div className="entry-details">
                      {pickup.relationship && <span>{pickup.relationship}</span>}
                      {pickup.relationship && pickup.phone && <span> &bull; </span>}
                      {pickup.phone && <span>{pickup.phone}</span>}
                    </div>
                  </div>
                  <div className="entry-actions">
                    <button className="btn-icon" onClick={() => handleEditPickup(child.id, pickup)} title="Edit">&#9998;</button>
                    <button className="btn-icon danger" onClick={() => handleRemovePickup(child.id, pickup.id)} title="Remove">&times;</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No authorized pickups added yet.</p>
          )}

          {(editingPickup && editingPickup.childId === child.id) && renderPickupForm(child.id)}

          {addingPickupFor === child.id ? (
            renderPickupForm(child.id)
          ) : (
            !editingPickup || editingPickup.childId !== child.id ? (
              <button className="add-entry-btn" onClick={() => handleAddPickup(child.id)}>
                <span>+</span> Add Authorized Pickup
              </button>
            ) : null
          )}
        </section>
      ))}

      {/* Change Password */}
      <section className="account-section">
        <h2>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" name="current_password" className="form-input"
              value={passwords.current_password} onChange={handlePasswordChange} autoComplete="current-password" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>New Password</label>
              <input type="password" name="new_password" className="form-input"
                value={passwords.new_password} onChange={handlePasswordChange} autoComplete="new-password" />
              <p className="form-helper">Must be at least 8 characters</p>
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" name="confirm_password" className="form-input"
                value={passwords.confirm_password} onChange={handlePasswordChange} autoComplete="new-password" />
            </div>
          </div>
          <div className="section-actions">
            <button type="submit" className="btn btn-primary"
              disabled={saving || !passwords.current_password || !passwords.new_password}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default MyAccount;
