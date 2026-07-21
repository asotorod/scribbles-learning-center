import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './AdminInquiries.css';

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      const res = await api.get('/contact', { params });
      const data = res.data?.data?.inquiries || [];
      setInquiries(data);
      setStats({
        total: res.data?.data?.total || data.length,
        unread: data.filter(i => !i.isRead).length,
        read: data.filter(i => i.isRead).length,
      });
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
      setError('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const markAsRead = async (id, isRead) => {
    try {
      await api.put(`/contact/${id}/read`, { isRead });
      setInquiries(prev =>
        prev.map(inq =>
          inq.id === id ? { ...inq, isRead } : inq
        )
      );
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(prev => ({ ...prev, isRead }));
      }
      setStats(prev => ({
        ...prev,
        unread: isRead ? prev.unread - 1 : prev.unread + 1,
        read: isRead ? prev.read + 1 : prev.read - 1,
      }));
    } catch (err) {
      console.error('Failed to update inquiry:', err);
    }
  };

  const openInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    if (!inquiry.isRead) {
      markAsRead(inquiry.id, true);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  const subjectLabels = {
    tour: 'Schedule a Tour',
    enrollment: 'Enrollment Inquiry',
    infant: 'Infant Care Program',
    toddler: 'Toddler Program',
    preschool: 'Preschool Program',
    'summer-camp': 'Summer Camp',
    pricing: 'Pricing Information',
    careers: 'Employment / Careers',
    other: 'General Question',
  };

  return (
    <div className="admin-inquiries">
      <div className="admin-page-header">
        <div>
          <h1>Contact Inquiries</h1>
          <p>Messages submitted through the website contact form</p>
        </div>
        <button className="btn btn-outline" onClick={fetchInquiries}>
          &#x21bb; Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="inquiry-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card stat-unread">
          <div className="stat-number">{stats.unread}</div>
          <div className="stat-label">Unread</div>
        </div>
        <div className="stat-card stat-read">
          <div className="stat-number">{stats.read}</div>
          <div className="stat-label">Read</div>
        </div>
      </div>

      {/* Filters */}
      <div className="inquiry-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
        <button
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Read
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">&#x1F4EC;</div>
          <h3>No inquiries found</h3>
          <p>{filter !== 'all' ? `No ${filter} inquiries.` : 'No contact form submissions yet.'}</p>
        </div>
      ) : (
        <div className="inquiries-layout">
          {/* Inquiry List */}
          <div className="inquiry-list">
            {inquiries.map(inq => (
              <div
                key={inq.id}
                className={`inquiry-row ${!inq.isRead ? 'unread' : ''} ${selectedInquiry?.id === inq.id ? 'selected' : ''}`}
                onClick={() => openInquiry(inq)}
              >
                <div className="inquiry-row-header">
                  <span className={`read-dot ${!inq.isRead ? 'visible' : ''}`}></span>
                  <strong className="inquiry-name">{inq.name}</strong>
                  <span className="inquiry-date">{formatDate(inq.createdAt)}</span>
                </div>
                <div className="inquiry-subject">
                  {subjectLabels[inq.subject] || inq.subject || 'General'}
                </div>
                <div className="inquiry-preview">
                  {inq.message?.substring(0, 100)}{inq.message?.length > 100 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Inquiry Detail */}
          {selectedInquiry ? (
            <div className="inquiry-detail">
              <div className="detail-header">
                <h2>{selectedInquiry.name}</h2>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => markAsRead(selectedInquiry.id, !selectedInquiry.isRead)}
                >
                  {selectedInquiry.isRead ? 'Mark Unread' : 'Mark Read'}
                </button>
              </div>

              <div className="detail-meta">
                <div className="meta-item">
                  <span className="meta-label">Email</span>
                  <a href={`mailto:${selectedInquiry.email}`}>{selectedInquiry.email}</a>
                </div>
                {selectedInquiry.phone && (
                  <div className="meta-item">
                    <span className="meta-label">Phone</span>
                    <a href={`tel:${selectedInquiry.phone}`}>{selectedInquiry.phone}</a>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-label">Subject</span>
                  <span>{subjectLabels[selectedInquiry.subject] || selectedInquiry.subject || 'General'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Received</span>
                  <span>{formatDate(selectedInquiry.createdAt)}</span>
                </div>
              </div>

              <div className="detail-message">
                <h3>Message</h3>
                <p>{selectedInquiry.message}</p>
              </div>

              <div className="detail-actions">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re: ${subjectLabels[selectedInquiry.subject] || 'Your inquiry'} - Scribbles Learning Center`}
                  className="btn btn-primary"
                >
                  &#x2709; Reply via Email
                </a>
                {selectedInquiry.phone && (
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="btn btn-outline"
                  >
                    &#x1F4DE; Call {selectedInquiry.name.split(' ')[0]}
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="inquiry-detail empty-detail">
              <div className="empty-icon">&#x1F449;</div>
              <p>Select an inquiry to view details</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;
