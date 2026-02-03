import React, { useState, useEffect } from 'react';
import Table, { TableToolbar, TablePagination } from '../../components/ui/Table';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './AdminParents.css';

// Convert API camelCase response to snake_case for frontend usage
const normalizeParent = (p) => ({
  id: p.id,
  first_name: p.firstName || p.first_name || '',
  last_name: p.lastName || p.last_name || '',
  email: p.email || '',
  phone: p.phone || '',
  address: p.address || '',
  pin_code: p.pinCode || p.pin_code || '',
  children: Array.isArray(p.children) ? p.children.map(c => ({
    id: c.id,
    first_name: c.firstName || c.first_name || '',
    last_name: c.lastName || c.last_name || '',
    relationship: c.relationship || '',
  })) : [],
});

const normalizeChild = (c) => ({
  id: c.id,
  first_name: c.firstName || c.first_name || '',
  last_name: c.lastName || c.last_name || '',
});

const AdminParents = () => {
  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageData, setMessageData] = useState({ subject: '', body: '' });
  const [messageSending, setMessageSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState('');
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    pin_code: '',
    password: '',
  });

  const [linkFormData, setLinkFormData] = useState({
    child_id: '',
    relationship: 'parent',
    is_primary_contact: false,
    is_authorized_pickup: true,
  });

  useEffect(() => {
    fetchParents();
    fetchChildren();
  }, []);

  const fetchParents = async () => {
    try {
      const response = await api.get('/parents');
      const data = response.data?.data?.parents;
      setParents(Array.isArray(data) ? data.map(normalizeParent) : []);
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await api.get('/children');
      const data = response.data?.data?.children;
      setChildren(Array.isArray(data) ? data.map(normalizeChild) : []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const handleOpenModal = (parent = null) => {
    setError('');
    if (parent) {
      setSelectedParent(parent);
      setFormData({
        first_name: parent.first_name || '',
        last_name: parent.last_name || '',
        email: parent.email || '',
        phone: parent.phone || '',
        address: parent.address || '',
        pin_code: parent.pin_code || '',
        password: '',
      });
    } else {
      setSelectedParent(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        pin_code: '',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParent(null);
    setError('');
  };

  const handleOpenLinkModal = (parent) => {
    setSelectedParent(parent);
    setError('');
    setLinkFormData({
      child_id: '',
      relationship: 'parent',
      is_primary_contact: false,
      is_authorized_pickup: true,
    });
    setIsLinkModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Convert to camelCase for API
      const payload = {
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        pinCode: formData.pin_code || undefined,
      };

      if (selectedParent) {
        await api.put(`/parents/${selectedParent.id}`, payload);
      } else {
        // Password is required when creating a new parent
        payload.password = formData.password;
        await api.post('/parents', payload);
      }
      handleCloseModal();
      await fetchParents();
    } catch (err) {
      console.error('Error saving parent:', err);
      const msg = err.response?.data?.details?.map(d => d.message).join(', ')
        || err.response?.data?.error
        || 'Failed to save. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post(`/parents/${selectedParent.id}/link-child`, {
        childId: linkFormData.child_id,
        relationship: linkFormData.relationship,
        isPrimaryContact: linkFormData.is_primary_contact,
        isAuthorizedPickup: linkFormData.is_authorized_pickup,
      });
      setIsLinkModalOpen(false);
      await fetchParents();
    } catch (err) {
      console.error('Error linking child:', err);
      const msg = err.response?.data?.error || 'Failed to link child. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedParent) return;
    setSaving(true);

    try {
      await api.delete(`/parents/${selectedParent.id}`);
      setParents(prev => prev.filter(p => p.id !== selectedParent.id));
    } catch (err) {
      console.error('Error deleting parent:', err);
    } finally {
      setSaving(false);
      setIsDeleteOpen(false);
      setSelectedParent(null);
    }
  };

  const openDeleteConfirm = (parent) => {
    setSelectedParent(parent);
    setIsDeleteOpen(true);
  };

  const handleOpenMessageModal = (parent) => {
    setSelectedParent(parent);
    setMessageData({ subject: '', body: '' });
    setMessageSuccess('');
    setError('');
    setIsMessageModalOpen(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setMessageSending(true);
    setError('');

    try {
      await api.post(`/parents/${selectedParent.id}/messages`, {
        subject: messageData.subject,
        body: messageData.body,
      });
      setMessageSuccess('Message sent successfully!');
      setTimeout(() => {
        setIsMessageModalOpen(false);
        setMessageSuccess('');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send message.';
      setError(msg);
    } finally {
      setMessageSending(false);
    }
  };

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData(prev => ({ ...prev, pin_code: pin }));
  };

  // Filter and paginate
  const filteredParents = parents.filter(parent => {
    const fullName = `${parent.first_name} ${parent.last_name} ${parent.email}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filteredParents.length / itemsPerPage);
  const paginatedParents = filteredParents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'name',
      title: 'Parent',
      render: (_, parent) => (
        <div className="parent-cell">
          <div className="parent-avatar">
            {parent.first_name?.charAt(0)}
          </div>
          <div>
            <span className="parent-name">{parent.first_name} {parent.last_name}</span>
            <span className="parent-email">{parent.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (val) => val || <span className="cell-muted">Not provided</span>,
    },
    {
      key: 'children',
      title: 'Children',
      render: (children) => {
        if (!children || children.length === 0) {
          return <span className="cell-muted">None linked</span>;
        }
        return (
          <div className="linked-children">
            {children.map((child, idx) => (
              <span key={idx} className="child-tag">
                {child.first_name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'pin_code',
      title: 'PIN',
      render: (val) => val ? <code className="pin-code">{val}</code> : <span className="cell-muted">Not set</span>,
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '230px',
      render: (_, parent) => (
        <div className="action-buttons">
          <button
            className="action-btn action-btn-message"
            onClick={() => handleOpenMessageModal(parent)}
            title="Send Message"
          >
            Msg
          </button>
          <button
            className="action-btn action-btn-view"
            onClick={() => handleOpenLinkModal(parent)}
            title="Link Child"
          >
            Link
          </button>
          <button
            className="action-btn action-btn-edit"
            onClick={() => handleOpenModal(parent)}
          >
            Edit
          </button>
          <button
            className="action-btn action-btn-delete"
            onClick={() => openDeleteConfirm(parent)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-parents">
      <div className="admin-page-header">
        <div>
          <h1>Parents</h1>
          <p>Manage parent accounts and link them to children</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Add Parent
        </Button>
      </div>

      <div className="table-container">
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search parents..."
        />
        <Table
          columns={columns}
          data={paginatedParents}
          loading={loading}
          emptyMessage="No parents found"
        />
        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredParents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedParent ? 'Edit Parent' : 'Add New Parent'}
        size="medium"
      >
        <form onSubmit={handleSave}>
          {error && <div className="form-error" style={{ color: '#DC2626', marginBottom: '16px', padding: '8px 12px', background: '#FEE2E2', borderRadius: '6px', fontSize: '14px' }}>{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name *</label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name *</label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {!selectedParent && (
            <div className="form-group">
              <label htmlFor="password">Portal Password *</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!selectedParent}
                minLength="8"
                placeholder="Min 8 characters — for parent portal login"
              />
              <span className="form-help">Parents use this to log into the parent portal</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pin_code">Kiosk PIN Code</label>
            <div className="pin-input-group">
              <input
                type="text"
                id="pin_code"
                value={formData.pin_code}
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                maxLength="4"
                pattern="[0-9]{4}"
                placeholder="4-digit PIN"
              />
              <Button type="button" variant="outline" size="small" onClick={generatePin}>
                Generate
              </Button>
            </div>
            <span className="form-help">Used for kiosk check-in/out</span>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {selectedParent ? 'Save Changes' : 'Add Parent'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Link Child Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Link Child to Parent"
        size="small"
      >
        <form onSubmit={handleLinkChild}>
          {error && <div className="form-error" style={{ color: '#DC2626', marginBottom: '16px', padding: '8px 12px', background: '#FEE2E2', borderRadius: '6px', fontSize: '14px' }}>{error}</div>}
          <p className="link-info">
            Link a child to <strong>{selectedParent?.first_name} {selectedParent?.last_name}</strong>
          </p>

          <div className="form-group">
            <label htmlFor="child_id">Select Child *</label>
            <select
              id="child_id"
              value={linkFormData.child_id}
              onChange={(e) => setLinkFormData({ ...linkFormData, child_id: e.target.value })}
              required
            >
              <option value="">Choose a child...</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="relationship">Relationship</label>
            <select
              id="relationship"
              value={linkFormData.relationship}
              onChange={(e) => setLinkFormData({ ...linkFormData, relationship: e.target.value })}
            >
              <option value="parent">Parent</option>
              <option value="guardian">Guardian</option>
              <option value="grandparent">Grandparent</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={linkFormData.is_primary_contact}
                onChange={(e) => setLinkFormData({ ...linkFormData, is_primary_contact: e.target.checked })}
              />
              <span>Primary Contact</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={linkFormData.is_authorized_pickup}
                onChange={(e) => setLinkFormData({ ...linkFormData, is_authorized_pickup: e.target.checked })}
              />
              <span>Authorized for Pickup</span>
            </label>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" type="button" onClick={() => setIsLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              Link Child
            </Button>
          </div>
        </form>
      </Modal>

      {/* Send Message Modal */}
      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title="Send Message"
        size="medium"
      >
        {messageSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '16px' }}>{messageSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage}>
            {error && <div className="form-error" style={{ color: '#DC2626', marginBottom: '16px', padding: '8px 12px', background: '#FEE2E2', borderRadius: '6px', fontSize: '14px' }}>{error}</div>}
            <p className="link-info">
              Send a message to <strong>{selectedParent?.first_name} {selectedParent?.last_name}</strong>
            </p>
            <div className="form-group">
              <label htmlFor="msg_subject">Subject *</label>
              <input
                type="text"
                id="msg_subject"
                value={messageData.subject}
                onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                required
                maxLength={200}
                placeholder="Message subject"
              />
            </div>
            <div className="form-group">
              <label htmlFor="msg_body">Message *</label>
              <textarea
                id="msg_body"
                value={messageData.body}
                onChange={(e) => setMessageData({ ...messageData, body: e.target.value })}
                required
                maxLength={5000}
                rows={6}
                placeholder="Write your message..."
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={() => setIsMessageModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={messageSending}>
                Send Message
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Parent"
        message={`Are you sure you want to delete ${selectedParent?.first_name} ${selectedParent?.last_name}? This will also remove their portal access.`}
        confirmText="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
};

export default AdminParents;
