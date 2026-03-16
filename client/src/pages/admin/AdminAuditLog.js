import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const ACTION_OPTIONS = [
  'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE',
  'CHILD_CREATE', 'CHILD_UPDATE', 'CHILD_DELETE',
  'PARENT_CREATE', 'PARENT_UPDATE', 'PARENT_DELETE',
  'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE',
  'CONTENT_UPDATE', 'ATTENDANCE_MODIFY', 'ADMIN_ADJUSTMENT',
];

const AdminAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ action: '', startDate: '', endDate: '' });

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 50 };
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/admin/audit-log', { params });
      const data = res.data?.data || {};
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Audit Log</h1>
        <p>Review system activity and security events</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Action</label>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>From</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>To</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          />
        </div>
        <button
          onClick={() => setFilters({ action: '', startDate: '', endDate: '' })}
          style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}
        >
          Clear
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, backgroundColor: '#fef2f2', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>Time</th>
              <th style={{ padding: '10px 12px' }}>User</th>
              <th style={{ padding: '10px 12px' }}>Action</th>
              <th style={{ padding: '10px 12px' }}>Resource</th>
              <th style={{ padding: '10px 12px' }}>IP Address</th>
              <th style={{ padding: '10px 12px' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No audit log entries found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                  <td style={{ padding: '10px 12px' }}>{log.user_email || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: log.action.includes('FAILED') ? '#fef2f2' : log.action.includes('SUCCESS') ? '#f0fdf4' : '#f3f4f6',
                      color: log.action.includes('FAILED') ? '#dc2626' : log.action.includes('SUCCESS') ? '#16a34a' : '#374151',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{log.resource || '-'}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{log.ip_address || '-'}</td>
                  <td style={{ padding: '10px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => fetchLogs(pagination.page - 1)}
            disabled={pagination.page <= 1}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}
          >
            Previous
          </button>
          <span style={{ padding: '6px 14px', fontSize: 13 }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            onClick={() => fetchLogs(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
