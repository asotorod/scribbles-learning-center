import React, { useState, useEffect, useCallback } from 'react';
import { employeesAPI, timeclockAPI } from '../../services/api';
import './AdminHR.css';

const AdminHR = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinEmployee, setPinEmployee] = useState(null);
  const [pinValue, setPinValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [timeclockData, setTimeclockData] = useState(null);
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [editingPunch, setEditingPunch] = useState(null);
  const [showAddPunchModal, setShowAddPunchModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
    position: '', department: '', hireDate: '', hourlyRate: '',
    pinCode: '', emergencyContactName: '', emergencyContactPhone: ''
  });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeesAPI.getAll({ search, status: 'active' });
      setEmployees(res.data?.data?.employees || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchTimeclock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await timeclockAPI.getToday();
      setTimeclockData(res.data?.data || null);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load time clock data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'employees') fetchEmployees();
    else if (activeTab === 'timeclock') fetchTimeclock();
  }, [activeTab, fetchEmployees, fetchTimeclock]);

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', phone: '', password: '',
      position: '', department: '', hireDate: '', hourlyRate: '',
      pinCode: '', emergencyContactName: '', emergencyContactPhone: ''
    });
    setEditingEmployee(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      password: '',
      position: emp.position || '',
      department: emp.department || '',
      hireDate: emp.hireDate ? emp.hireDate.split('T')[0] : '',
      hourlyRate: emp.hourlyRate || '',
      pinCode: '',
      emergencyContactName: emp.emergencyContact?.name || '',
      emergencyContactPhone: emp.emergencyContact?.phone || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingEmployee) {
        const updateData = { ...formData };
        delete updateData.password;
        delete updateData.pinCode;
        if (!updateData.hourlyRate) delete updateData.hourlyRate;
        await employeesAPI.update(editingEmployee.id, updateData);
      } else {
        if (!formData.password) {
          setError('Password is required for new employees');
          return;
        }
        await employeesAPI.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save employee');
    }
  };

  const handleDelete = async (id) => {
    try {
      await employeesAPI.delete(id);
      setShowDeleteConfirm(null);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    try {
      await employeesAPI.updatePin(pinEmployee.id, { pinCode: pinValue });
      setShowPinModal(false);
      setPinEmployee(null);
      setPinValue('');
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update PIN');
    }
  };

  const handleEditPunch = async (e) => {
    e.preventDefault();
    try {
      await timeclockAPI.editEntry(editingPunch.id, {
        clockIn: editingPunch.clockIn,
        clockOut: editingPunch.clockOut || null,
        adjustmentReason: editingPunch.adjustmentReason
      });
      setShowPunchModal(false);
      setEditingPunch(null);
      fetchTimeclock();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update punch');
    }
  };

  const handleAddPunch = async (e) => {
    e.preventDefault();
    try {
      await timeclockAPI.addPunch({
        employeeId: editingPunch.employeeId,
        clockIn: editingPunch.clockIn,
        clockOut: editingPunch.clockOut || null,
        entryType: editingPunch.entryType || 'shift',
        notes: editingPunch.notes
      });
      setShowAddPunchModal(false);
      setEditingPunch(null);
      fetchTimeclock();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add punch');
    }
  };

  const handleDeletePunch = async (punchId) => {
    if (!window.confirm('Delete this time entry?')) return;
    try {
      await timeclockAPI.deleteEntry(punchId);
      fetchTimeclock();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete punch');
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const map = {
      clocked_in: { label: 'Clocked In', cls: 'status-success' },
      on_lunch: { label: 'On Lunch', cls: 'status-warning' },
      clocked_out: { label: 'Clocked Out', cls: 'status-neutral' },
      not_clocked_in: { label: 'Not Clocked In', cls: 'status-danger' }
    };
    const s = map[status] || { label: status, cls: '' };
    return <span className={`hr-status-badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="admin-hr">
      <div className="admin-page-header">
        <div>
          <h1>HR Management</h1>
          <p>Manage employees, time clock, and job postings</p>
        </div>
      </div>

      {error && (
        <div className="hr-error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="hr-tabs">
        <button className={`hr-tab ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
          👥 Employees
        </button>
        <button className={`hr-tab ${activeTab === 'timeclock' ? 'active' : ''}`} onClick={() => setActiveTab('timeclock')}>
          ⏰ Time Clock
        </button>
      </div>

      {/* ========== EMPLOYEES TAB ========== */}
      {activeTab === 'employees' && (
        <div className="hr-tab-content">
          <div className="hr-toolbar">
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hr-search"
            />
            <button className="hr-btn-primary" onClick={handleOpenAdd}>+ Add Employee</button>
          </div>

          {loading ? (
            <div className="hr-loading"><div className="loading-spinner" /><p>Loading employees...</p></div>
          ) : employees.length === 0 ? (
            <div className="hr-empty"><span className="hr-empty-icon">👥</span><h3>No Employees Found</h3><p>Add your first employee to get started.</p></div>
          ) : (
            <div className="hr-table-container">
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>PIN</th>
                    <th>Hire Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div className="emp-name-cell">
                          <div className="emp-avatar">{emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}</div>
                          <span>{emp.firstName} {emp.lastName}</span>
                        </div>
                      </td>
                      <td>{emp.position || '-'}</td>
                      <td>{emp.department || '-'}</td>
                      <td>{emp.email}</td>
                      <td>{emp.phone || '-'}</td>
                      <td>
                        <button
                          className={`hr-pin-btn ${emp.hasPinCode ? 'has-pin' : 'no-pin'}`}
                          onClick={() => { setPinEmployee(emp); setPinValue(''); setShowPinModal(true); }}
                        >
                          {emp.hasPinCode ? '🔒 Set' : '🔓 None'}
                        </button>
                      </td>
                      <td>{formatDate(emp.hireDate)}</td>
                      <td>
                        <div className="hr-actions">
                          <button className="hr-btn-icon" title="Edit" onClick={() => handleOpenEdit(emp)}>✏️</button>
                          <button className="hr-btn-icon danger" title="Delete" onClick={() => setShowDeleteConfirm(emp)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========== TIME CLOCK TAB ========== */}
      {activeTab === 'timeclock' && (
        <div className="hr-tab-content">
          <div className="hr-toolbar">
            <h3>Today's Time Clock</h3>
            <button className="hr-btn-primary" onClick={() => {
              setEditingPunch({ employeeId: '', clockIn: '', clockOut: '', entryType: 'shift', notes: '' });
              setShowAddPunchModal(true);
            }}>+ Add Missing Punch</button>
          </div>

          {loading ? (
            <div className="hr-loading"><div className="loading-spinner" /><p>Loading time clock...</p></div>
          ) : !timeclockData ? (
            <div className="hr-empty"><span className="hr-empty-icon">⏰</span><h3>No Data</h3><p>Could not load time clock data.</p></div>
          ) : (
            <>
              <div className="hr-stats-grid">
                <div className="hr-stat-card">
                  <div className="hr-stat-value">{timeclockData.stats?.totalEmployees || 0}</div>
                  <div className="hr-stat-label">Total Staff</div>
                </div>
                <div className="hr-stat-card success">
                  <div className="hr-stat-value">{timeclockData.stats?.clockedIn || 0}</div>
                  <div className="hr-stat-label">Clocked In</div>
                </div>
                <div className="hr-stat-card warning">
                  <div className="hr-stat-value">{timeclockData.stats?.onLunch || 0}</div>
                  <div className="hr-stat-label">On Lunch</div>
                </div>
                <div className="hr-stat-card neutral">
                  <div className="hr-stat-value">{timeclockData.stats?.clockedOut || 0}</div>
                  <div className="hr-stat-label">Clocked Out</div>
                </div>
              </div>

              <div className="hr-table-container">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Status</th>
                      <th>Punches</th>
                      <th>Work Hours</th>
                      <th>Lunch</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(timeclockData.employees || []).map(emp => (
                      <tr key={emp.employeeId}>
                        <td>
                          <div className="emp-name-cell">
                            <div className="emp-avatar">{emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}</div>
                            <div>
                              <span className="emp-name">{emp.firstName} {emp.lastName}</span>
                              <span className="emp-position">{emp.position}</span>
                            </div>
                          </div>
                        </td>
                        <td>{getStatusBadge(emp.status)}</td>
                        <td>
                          <div className="punch-list">
                            {emp.timeRecords.length === 0 ? (
                              <span className="no-punches">No punches</span>
                            ) : (
                              emp.timeRecords.map((tr, i) => (
                                <div key={tr.id} className={`punch-entry ${tr.entryType === 'lunch_break' ? 'lunch' : ''}`}>
                                  <span className="punch-type">{tr.entryType === 'lunch_break' ? '🍽️' : '⏱️'}</span>
                                  <span>{formatTime(tr.clockIn)} → {formatTime(tr.clockOut)}</span>
                                  <button className="punch-edit-btn" onClick={() => {
                                    setEditingPunch({
                                      id: tr.id,
                                      clockIn: tr.clockIn ? new Date(new Date(tr.clockIn).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
                                      clockOut: tr.clockOut ? new Date(new Date(tr.clockOut).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
                                      adjustmentReason: ''
                                    });
                                    setShowPunchModal(true);
                                  }}>✏️</button>
                                  <button className="punch-edit-btn danger" onClick={() => handleDeletePunch(tr.id)}>✕</button>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                        <td><strong>{(emp.totalWorkMinutes / 60).toFixed(1)}h</strong></td>
                        <td>{emp.totalLunchMinutes > 0 ? `${(emp.totalLunchMinutes / 60).toFixed(1)}h` : '-'}</td>
                        <td>
                          <button className="hr-btn-sm" onClick={() => {
                            const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                            setEditingPunch({ employeeId: emp.employeeId, clockIn: now, clockOut: '', entryType: 'shift', notes: '' });
                            setShowAddPunchModal(true);
                          }}>+ Punch</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========== ADD/EDIT EMPLOYEE MODAL ========== */}
      {showModal && (
        <div className="hr-modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="hr-modal" onClick={e => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="hr-modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
            </div>
            <form onSubmit={handleSave} className="hr-form">
              <div className="hr-form-grid">
                <div className="hr-form-group">
                  <label>First Name *</label>
                  <input type="text" required value={formData.firstName} onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label>Last Name *</label>
                  <input type="text" required value={formData.lastName} onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label>Email *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label>Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                </div>
                {!editingEmployee && (
                  <div className="hr-form-group">
                    <label>Password *</label>
                    <input type="password" required value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
                  </div>
                )}
                <div className="hr-form-group">
                  <label>Position</label>
                  <input type="text" value={formData.position} onChange={e => setFormData(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Lead Teacher" />
                </div>
                <div className="hr-form-group">
                  <label>Department</label>
                  <select value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="Teaching">Teaching</option>
                    <option value="Administration">Administration</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="hr-form-group">
                  <label>Hire Date</label>
                  <input type="date" value={formData.hireDate} onChange={e => setFormData(p => ({ ...p, hireDate: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label>Hourly Rate ($)</label>
                  <input type="number" step="0.01" value={formData.hourlyRate} onChange={e => setFormData(p => ({ ...p, hourlyRate: e.target.value }))} />
                </div>
                {!editingEmployee && (
                  <div className="hr-form-group">
                    <label>PIN Code (for kiosk)</label>
                    <input type="text" maxLength={6} value={formData.pinCode} onChange={e => setFormData(p => ({ ...p, pinCode: e.target.value.replace(/\D/g, '') }))} placeholder="4-6 digits" />
                  </div>
                )}
                <div className="hr-form-group">
                  <label>Emergency Contact Name</label>
                  <input type="text" value={formData.emergencyContactName} onChange={e => setFormData(p => ({ ...p, emergencyContactName: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label>Emergency Contact Phone</label>
                  <input type="tel" value={formData.emergencyContactPhone} onChange={e => setFormData(p => ({ ...p, emergencyContactPhone: e.target.value }))} />
                </div>
              </div>
              <div className="hr-modal-footer">
                <button type="button" className="hr-btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="hr-btn-primary">{editingEmployee ? 'Save Changes' : 'Add Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== SET PIN MODAL ========== */}
      {showPinModal && pinEmployee && (
        <div className="hr-modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="hr-modal hr-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h2>Set PIN for {pinEmployee.firstName} {pinEmployee.lastName}</h2>
              <button className="hr-modal-close" onClick={() => setShowPinModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSetPin}>
              <div className="hr-form-group" style={{ padding: '24px' }}>
                <label>Enter PIN Code (4-6 digits)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinValue}
                  onChange={e => setPinValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  autoFocus
                  style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
                />
                <p className="hr-hint">This PIN will be used for kiosk clock-in/out</p>
              </div>
              <div className="hr-modal-footer">
                <button type="button" className="hr-btn-secondary" onClick={() => setShowPinModal(false)}>Cancel</button>
                <button type="submit" className="hr-btn-primary" disabled={pinValue.length < 4}>Set PIN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRM MODAL ========== */}
      {showDeleteConfirm && (
        <div className="hr-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="hr-modal hr-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h2>Deactivate Employee</h2>
              <button className="hr-modal-close" onClick={() => setShowDeleteConfirm(null)}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p>Are you sure you want to deactivate <strong>{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</strong>?</p>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>Their account will be disabled but data will be preserved.</p>
            </div>
            <div className="hr-modal-footer">
              <button className="hr-btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="hr-btn-danger" onClick={() => handleDelete(showDeleteConfirm.id)}>Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT PUNCH MODAL ========== */}
      {showPunchModal && editingPunch && (
        <div className="hr-modal-overlay" onClick={() => setShowPunchModal(false)}>
          <div className="hr-modal hr-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h2>Adjust Time Punch</h2>
              <button className="hr-modal-close" onClick={() => setShowPunchModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditPunch}>
              <div style={{ padding: '24px' }}>
                <div className="hr-form-group">
                  <label>Clock In</label>
                  <input type="datetime-local" value={editingPunch.clockIn} onChange={e => setEditingPunch(p => ({ ...p, clockIn: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label>Clock Out</label>
                  <input type="datetime-local" value={editingPunch.clockOut} onChange={e => setEditingPunch(p => ({ ...p, clockOut: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label>Reason for Adjustment *</label>
                  <input type="text" required value={editingPunch.adjustmentReason} onChange={e => setEditingPunch(p => ({ ...p, adjustmentReason: e.target.value }))} placeholder="e.g. Forgot to clock out" />
                </div>
              </div>
              <div className="hr-modal-footer">
                <button type="button" className="hr-btn-secondary" onClick={() => setShowPunchModal(false)}>Cancel</button>
                <button type="submit" className="hr-btn-primary">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== ADD MISSING PUNCH MODAL ========== */}
      {showAddPunchModal && editingPunch && (
        <div className="hr-modal-overlay" onClick={() => setShowAddPunchModal(false)}>
          <div className="hr-modal hr-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h2>Add Missing Punch</h2>
              <button className="hr-modal-close" onClick={() => setShowAddPunchModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPunch}>
              <div style={{ padding: '24px' }}>
                {!editingPunch.employeeId && (
                  <div className="hr-form-group">
                    <label>Employee *</label>
                    <select required value={editingPunch.employeeId} onChange={e => setEditingPunch(p => ({ ...p, employeeId: e.target.value }))}>
                      <option value="">Select employee...</option>
                      {(timeclockData?.employees || employees).map(emp => (
                        <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="hr-form-group">
                  <label>Type</label>
                  <select value={editingPunch.entryType} onChange={e => setEditingPunch(p => ({ ...p, entryType: e.target.value }))}>
                    <option value="shift">Work Shift</option>
                    <option value="lunch_break">Lunch Break</option>
                  </select>
                </div>
                <div className="hr-form-group">
                  <label>Clock In *</label>
                  <input type="datetime-local" required value={editingPunch.clockIn} onChange={e => setEditingPunch(p => ({ ...p, clockIn: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label>Clock Out</label>
                  <input type="datetime-local" value={editingPunch.clockOut} onChange={e => setEditingPunch(p => ({ ...p, clockOut: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label>Notes</label>
                  <input type="text" value={editingPunch.notes || ''} onChange={e => setEditingPunch(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Forgot to punch in" />
                </div>
              </div>
              <div className="hr-modal-footer">
                <button type="button" className="hr-btn-secondary" onClick={() => setShowAddPunchModal(false)}>Cancel</button>
                <button type="submit" className="hr-btn-primary">Add Punch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHR;
