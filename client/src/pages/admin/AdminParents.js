import React, { useState, useEffect } from 'react';
import Table, { TableToolbar, TablePagination } from '../../components/ui/Table';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './AdminParents.css';

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
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    pin_code: '',
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
      setParents(response.data?.data || mockParents);
    } catch (error) {
      console.error('Error fetching parents:', error);
      setParents(mockParents);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await api.get('/children');
      setChildren(response.data?.data || mockChildren);
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren(mockChildren);
    }
  };

  const handleOpenModal = (parent = null) => {
    if (parent) {
      setSelectedParent(parent);
      setFormData({
        first_name: parent.first_name || '',
        last_name: parent.last_name || '',
        email: parent.email || '',
        phone: parent.phone || '',
        address: parent.address || '',
        pin_code: parent.pin_code || '',
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
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParent(null);
  };

  const handleOpenLinkModal = (parent) => {
    setSelectedParent(parent);
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

    try {
      if (selectedParent) {
        await api.put(`/parents/${selectedParent.id}`, formData);
        setParents(prev =>
          prev.map(p => p.id === selectedParent.id ? { ...p, ...formData } : p)
        );
      } else {
        const response = await api.post('/parents', formData);
        const newParent = response.data?.data || { id: Date.now(), ...formData, children: [] };
        setParents(prev => [newParent, ...prev]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving parent:', error);
      // For demo, still update local state
      if (selectedParent) {
        setParents(prev =>
          prev.map(p => p.id === selectedParent.id ? { ...p, ...formData } : p)
        );
      } else {
        setParents(prev => [{ id: Date.now(), ...formData, children: [], is_active: true }, ...prev]);
      }
      handleCloseModal();
    } finally {
      setSaving(false);
    }
  };

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post(`/parents/${selectedParent.id}/link-child`, linkFormData);
      // Update local state with linked child
      const linkedChild = children.find(c => c.id === linkFormData.child_id);
      if (linkedChild) {
        setParents(prev =>
          prev.map(p => {
            if (p.id === selectedParent.id) {
              const existingChildren = p.children || [];
              return {
                ...p,
                children: [...existingChildren, {
                  ...linkedChild,
                  relationship: linkFormData.relationship,
                }],
              };
            }
            return p;
          })
        );
      }
      setIsLinkModalOpen(false);
    } catch (error) {
      console.error('Error linking child:', error);
      // For demo, still update local state
      const linkedChild = children.find(c => c.id.toString() === linkFormData.child_id);
      if (linkedChild) {
        setParents(prev =>
          prev.map(p => {
            if (p.id === selectedParent.id) {
              const existingChildren = p.children || [];
              return {
                ...p,
                children: [...existingChildren, {
                  ...linkedChild,
                  relationship: linkFormData.relationship,
                }],
              };
            }
            return p;
          })
        );
      }
      setIsLinkModalOpen(false);
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
    } catch (error) {
      console.error('Error deleting parent:', error);
      setParents(prev => prev.filter(p => p.id !== selectedParent.id));
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
      width: '180px',
      render: (_, parent) => (
        <div className="action-buttons">
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

// Mock data
const mockParents = [
  { id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.j@email.com', phone: '(201) 555-0101', pin_code: '1234', children: [{ first_name: 'Emma' }] },
  { id: 2, first_name: 'Michael', last_name: 'Smith', email: 'msmith@email.com', phone: '(201) 555-0102', pin_code: '2345', children: [{ first_name: 'Noah' }] },
  { id: 3, first_name: 'Jennifer', last_name: 'Williams', email: 'jwilliams@email.com', phone: '(201) 555-0103', pin_code: '3456', children: [{ first_name: 'Olivia' }] },
  { id: 4, first_name: 'David', last_name: 'Brown', email: 'dbrown@email.com', phone: '(201) 555-0104', pin_code: '4567', children: [{ first_name: 'Liam' }] },
  { id: 5, first_name: 'Emily', last_name: 'Davis', email: 'edavis@email.com', phone: '(201) 555-0105', pin_code: null, children: [{ first_name: 'Ava' }] },
];

const mockChildren = [
  { id: 1, first_name: 'Emma', last_name: 'Johnson' },
  { id: 2, first_name: 'Noah', last_name: 'Smith' },
  { id: 3, first_name: 'Olivia', last_name: 'Williams' },
  { id: 4, first_name: 'Liam', last_name: 'Brown' },
  { id: 5, first_name: 'Ava', last_name: 'Davis' },
  { id: 6, first_name: 'Ethan', last_name: 'Miller' },
  { id: 7, first_name: 'Sophia', last_name: 'Wilson' },
  { id: 8, first_name: 'Mason', last_name: 'Moore' },
];

export default AdminParents;
