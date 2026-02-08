import React, { useState, useEffect, useRef } from 'react';
import Table, { TableToolbar, TablePagination } from '../../components/ui/Table';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { compressImage, validateImageFile, ACCEPTED_IMAGE_TYPES } from '../../utils/imageUtils';
import './AdminChildren.css';

// Convert API camelCase response to snake_case for frontend usage
const normalizeChild = (c) => ({
  id: c.id,
  first_name: c.firstName || c.first_name || '',
  last_name: c.lastName || c.last_name || '',
  date_of_birth: c.dateOfBirth || c.date_of_birth || '',
  photo_url: c.photoUrl || c.photo_url || null,
  program_id: c.programId || c.program_id || '',
  program_name: c.programName || c.program_name || null,
  program_color: c.programColor || c.program_color || null,
  allergies: c.allergies || '',
  medical_notes: c.medicalNotes || c.medical_notes || '',
  emergency_contact_name: c.emergencyContactName || c.emergency_contact_name || '',
  emergency_contact_phone: c.emergencyContactPhone || c.emergency_contact_phone || '',
  is_active: c.isActive !== undefined ? c.isActive : (c.is_active !== undefined ? c.is_active : true),
});

// Convert form data to camelCase for API requests
const toApiPayload = (form) => ({
  firstName: form.first_name,
  lastName: form.last_name,
  dateOfBirth: form.date_of_birth,
  programId: form.program_id || undefined,
  allergies: form.allergies || undefined,
  medicalNotes: form.medical_notes || undefined,
  emergencyContactName: form.emergency_contact_name || undefined,
  emergencyContactPhone: form.emergency_contact_phone || undefined,
});

const AdminChildren = () => {
  const [children, setChildren] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const photoInputRef = useRef(null);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    program_id: '',
    allergies: '',
    medical_notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    fetchChildren();
    fetchPrograms();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await api.get('/children');
      const data = response.data?.data?.children;
      setChildren(Array.isArray(data) ? data.map(normalizeChild) : []);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/programs');
      const progData = response.data?.data?.programs;
      setPrograms(Array.isArray(progData) ? progData : []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleOpenModal = (child = null) => {
    setError('');
    if (child) {
      setSelectedChild(child);
      setFormData({
        first_name: child.first_name,
        last_name: child.last_name,
        date_of_birth: child.date_of_birth?.split('T')[0] || '',
        program_id: child.program_id || '',
        allergies: child.allergies || '',
        medical_notes: child.medical_notes || '',
        emergency_contact_name: child.emergency_contact_name || '',
        emergency_contact_phone: child.emergency_contact_phone || '',
      });
    } else {
      setSelectedChild(null);
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        program_id: '',
        allergies: '',
        medical_notes: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChild(null);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = toApiPayload(formData);
      if (selectedChild) {
        await api.put(`/children/${selectedChild.id}`, payload);
      } else {
        await api.post('/children', payload);
      }
      handleCloseModal();
      await fetchChildren();
    } catch (err) {
      console.error('Error saving child:', err);
      const msg = err.response?.data?.details?.map(d => d.message).join(', ')
        || err.response?.data?.error
        || 'Failed to save. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChild) return;
    setSaving(true);

    try {
      await api.delete(`/children/${selectedChild.id}`);
      setChildren(prev => prev.filter(c => c.id !== selectedChild.id));
    } catch (err) {
      console.error('Error deleting child:', err);
    } finally {
      setSaving(false);
      setIsDeleteOpen(false);
      setSelectedChild(null);
    }
  };

  const openDeleteConfirm = (child) => {
    setSelectedChild(child);
    setIsDeleteOpen(true);
  };

  const handleView = async (child) => {
    setIsViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    try {
      const response = await api.get(`/children/${child.id}`);
      setViewData(response.data?.data || null);
    } catch (err) {
      console.error('Error fetching child details:', err);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !viewData?.child) return;
    e.target.value = '';

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setPhotoUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      const response = await api.post(`/children/${viewData.child.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = response.data?.data?.photoUrl;
      if (newUrl) {
        // Update view modal data
        setViewData(prev => ({
          ...prev,
          child: { ...prev.child, photoUrl: newUrl },
        }));
        // Update children list
        setChildren(prev =>
          prev.map(c => c.id === viewData.child.id ? { ...c, photo_url: newUrl } : c)
        );
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      alert(err.response?.data?.error || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Filter and paginate
  const filteredChildren = children.filter(child => {
    const matchesSearch = `${child.first_name} ${child.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesProgram = !programFilter || child.program_id === programFilter;
    return matchesSearch && matchesProgram;
  });

  const totalPages = Math.ceil(filteredChildren.length / itemsPerPage);
  const paginatedChildren = filteredChildren.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'name',
      title: 'Name',
      render: (_, child) => (
        <div className="child-cell">
          <div className="child-avatar">
            {child.photo_url ? (
              <img src={child.photo_url} alt={child.first_name} className="child-avatar-img" />
            ) : (
              child.first_name?.charAt(0)
            )}
          </div>
          <div>
            <span className="child-name">{child.first_name} {child.last_name}</span>
            <span className="child-dob">
              DOB: {new Date(child.date_of_birth).toLocaleDateString()}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'program',
      title: 'Program',
      render: (_, child) => {
        const program = programs.find(p => p.id === child.program_id);
        return (
          <span className="program-badge" style={{ background: program?.color || '#E8E0D0' }}>
            {program?.name || child.program_name || 'Unassigned'}
          </span>
        );
      },
    },
    {
      key: 'allergies',
      title: 'Allergies',
      render: (val) => val || <span className="cell-muted">None</span>,
    },
    {
      key: 'is_active',
      title: 'Status',
      render: (val) => (
        <span className={`status-badge ${val !== false ? 'status-active' : 'status-inactive'}`}>
          {val !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '180px',
      render: (_, child) => (
        <div className="action-buttons">
          <button
            className="action-btn action-btn-view"
            onClick={() => handleView(child)}
          >
            View
          </button>
          <button
            className="action-btn action-btn-edit"
            onClick={() => handleOpenModal(child)}
          >
            Edit
          </button>
          <button
            className="action-btn action-btn-delete"
            onClick={() => openDeleteConfirm(child)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-children">
      <div className="admin-page-header">
        <div>
          <h1>Children</h1>
          <p>Manage enrolled children and their information</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Add Child
        </Button>
      </div>

      <div className="table-container">
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search children..."
          filters={
            <select
              value={programFilter}
              onChange={(e) => {
                setProgramFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Programs</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          }
        />
        <Table
          columns={columns}
          data={paginatedChildren}
          loading={loading}
          emptyMessage="No children found"
        />
        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredChildren.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedChild ? 'Edit Child' : 'Add New Child'}
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
              <label htmlFor="date_of_birth">Date of Birth *</label>
              <input
                type="date"
                id="date_of_birth"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="program_id">Program</label>
              <select
                id="program_id"
                value={formData.program_id}
                onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
              >
                <option value="">Select Program</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="allergies">Allergies</label>
            <input
              type="text"
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="e.g., Peanuts, Dairy"
            />
          </div>

          <div className="form-group">
            <label htmlFor="medical_notes">Medical Notes</label>
            <textarea
              id="medical_notes"
              rows="3"
              value={formData.medical_notes}
              onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
              placeholder="Any medical conditions or notes..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emergency_contact_name">Emergency Contact Name</label>
              <input
                type="text"
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="emergency_contact_phone">Emergency Contact Phone</label>
              <input
                type="tel"
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {selectedChild ? 'Save Changes' : 'Add Child'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Child"
        message={`Are you sure you want to delete ${selectedChild?.first_name} ${selectedChild?.last_name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={saving}
      />

      {/* View Child Detail Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Child Details"
        size="large"
      >
        {viewLoading ? (
          <div className="view-loading">
            <div className="loading-spinner" />
            <p>Loading child details...</p>
          </div>
        ) : viewData ? (
          <div className="child-detail">
            {/* Photo + Name Header */}
            <div className="detail-photo-header">
              <div className="detail-photo-wrapper">
                {viewData.child?.photoUrl ? (
                  <img src={viewData.child.photoUrl} alt={viewData.child.firstName} className="detail-photo" />
                ) : (
                  <div className="detail-photo-placeholder">
                    {viewData.child?.firstName?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="detail-photo-info">
                <h2 className="detail-child-name">{viewData.child?.firstName} {viewData.child?.lastName}</h2>
                {viewData.child?.programName && (
                  <span className="program-badge" style={{ background: viewData.child.programColor || '#E8E0D0' }}>
                    {viewData.child.programName}
                  </span>
                )}
                <button
                  className="action-btn action-btn-edit"
                  style={{ marginTop: '8px' }}
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                >
                  {photoUploading ? 'Uploading...' : (viewData.child?.photoUrl ? 'Change Photo' : 'Upload Photo')}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  style={{ display: 'none' }}
                  onChange={handleViewPhotoUpload}
                />
              </div>
            </div>

            {/* Child Info */}
            <div className="detail-section">
              <h3 className="detail-section-title">Child Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-value">
                    {viewData.child?.dateOfBirth
                      ? new Date(viewData.child.dateOfBirth).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <span className={`status-badge ${viewData.child?.isActive !== false ? 'status-active' : 'status-inactive'}`}>
                      {viewData.child?.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Photo Consent</span>
                  <span className="detail-value">
                    {viewData.child?.photoConsentGiven ? (
                      <span className="consent-status consent-given">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Yes (given {viewData.child.photoConsentDate
                          ? new Date(viewData.child.photoConsentDate).toLocaleDateString()
                          : 'date unknown'})
                      </span>
                    ) : (
                      <span className="consent-status consent-not-given">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        Not yet given
                      </span>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Allergies</span>
                  <span className="detail-value">{viewData.child?.allergies || 'None'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Medical Notes</span>
                  <span className="detail-value">{viewData.child?.medicalNotes || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Parents/Guardians */}
            <div className="detail-section">
              <h3 className="detail-section-title">Parents / Guardians</h3>
              {viewData.parents?.length > 0 ? (
                <div className="detail-list">
                  {viewData.parents.map((parent) => (
                    <div key={parent.id} className="detail-list-item">
                      <div className="detail-list-primary">
                        {parent.firstName} {parent.lastName}
                        {parent.isPrimaryContact && <span className="badge-primary-contact">Primary</span>}
                      </div>
                      <div className="detail-list-secondary">
                        {parent.relationship && <span>{parent.relationship}</span>}
                        {parent.phone && <span>{parent.phone}</span>}
                        {parent.email && <span>{parent.email}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="detail-empty">No parents linked</p>
              )}
            </div>

            {/* Authorized Pickups */}
            <div className="detail-section">
              <h3 className="detail-section-title">Authorized Pickups</h3>
              {viewData.authorizedPickups?.length > 0 ? (
                <div className="detail-list">
                  {viewData.authorizedPickups.map((pickup) => (
                    <div key={pickup.id} className="detail-list-item">
                      <div className="detail-list-primary">{pickup.name}</div>
                      <div className="detail-list-secondary">
                        {pickup.relationship && <span>{pickup.relationship}</span>}
                        {pickup.phone && <span>{pickup.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="detail-empty">No authorized pickups</p>
              )}
            </div>

            {/* Emergency Contacts */}
            <div className="detail-section">
              <h3 className="detail-section-title">Emergency Contacts</h3>
              {viewData.emergencyContacts?.length > 0 ? (
                <div className="detail-list">
                  {viewData.emergencyContacts.map((contact) => (
                    <div key={contact.id} className="detail-list-item">
                      <div className="detail-list-primary">
                        {contact.name}
                        {contact.isPrimary && <span className="badge-primary-contact">Primary</span>}
                      </div>
                      <div className="detail-list-secondary">
                        {contact.relationship && <span>{contact.relationship}</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : viewData.child?.emergencyContactName ? (
                <div className="detail-list">
                  <div className="detail-list-item">
                    <div className="detail-list-primary">{viewData.child.emergencyContactName}</div>
                    <div className="detail-list-secondary">
                      {viewData.child.emergencyContactPhone && <span>{viewData.child.emergencyContactPhone}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="detail-empty">No emergency contacts on file</p>
              )}
            </div>

            {/* Notes */}
            <div className="detail-section">
              <h3 className="detail-section-title">Notes</h3>
              <p className="detail-notes">
                {viewData.child?.medicalNotes || 'No additional notes'}
              </p>
            </div>
          </div>
        ) : (
          <p className="detail-empty">Failed to load child details.</p>
        )}
      </Modal>
    </div>
  );
};

export default AdminChildren;
