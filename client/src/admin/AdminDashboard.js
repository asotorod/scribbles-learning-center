import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI, contentAPI, inquiryAPI } from '../services/api';
import './Admin.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    { path: '/admin/inquiries', icon: '📬', label: 'Inquiries' },
    { path: '/admin/content', icon: '📝', label: 'Content' },
    { path: '/admin/gallery', icon: '🖼️', label: 'Gallery' },
    { path: '/admin/pricing', icon: '💰', label: 'Pricing' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Scribbles" />
          <span>Scribbles Admin</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${
                item.exact 
                  ? location.pathname === item.path ? 'active' : ''
                  : location.pathname.startsWith(item.path) ? 'active' : ''
              }`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.name || 'Admin'}</p>
              <p className="user-role">{user?.role || 'Administrator'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="inquiries" element={<InquiriesPanel />} />
          <Route path="content" element={<ContentPanel />} />
          <Route path="gallery" element={<GalleryPanel />} />
          <Route path="pricing" element={<PricingPanel />} />
          <Route path="settings" element={<SettingsPanel />} />
        </Routes>
      </main>
    </div>
  );
};

// Dashboard Home
const DashboardHome = () => {
  const [stats, setStats] = useState({ inquiries: 0, newInquiries: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await inquiryAPI.getAll();
        const inquiries = response.data;
        setStats({
          inquiries: inquiries.length,
          newInquiries: inquiries.filter(i => i.status === 'new').length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📬</div>
          <div className="stat-content">
            <h3>{stats.inquiries}</h3>
            <p>Total Inquiries</p>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <h3>{stats.newInquiries}</h3>
            <p>New Inquiries</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👶</div>
          <div className="stat-content">
            <h3>45</h3>
            <p>Capacity</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>4.9</h3>
            <p>Rating</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/inquiries" className="action-card">
            <span>📬</span>
            <p>View Inquiries</p>
          </Link>
          <Link to="/admin/content" className="action-card">
            <span>📝</span>
            <p>Edit Content</p>
          </Link>
          <Link to="/admin/gallery" className="action-card">
            <span>🖼️</span>
            <p>Manage Gallery</p>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="action-card">
            <span>🌐</span>
            <p>View Website</p>
          </a>
        </div>
      </div>
    </div>
  );
};

// Inquiries Panel
const InquiriesPanel = () => {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await inquiryAPI.getAll();
      setInquiries(response.data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedInquiry) return;
    
    try {
      await inquiryAPI.reply(selectedInquiry.id, replyText);
      setReplyText('');
      fetchInquiries();
      setSelectedInquiry(null);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: { bg: '#FEE2E2', color: '#DC2626' },
      read: { bg: '#FEF3C7', color: '#D97706' },
      replied: { bg: '#D1FAE5', color: '#059669' },
      archived: { bg: '#E5E7EB', color: '#6B7280' }
    };
    return styles[status] || styles.new;
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Parent Inquiries</h1>
        <p>Manage and respond to inquiries from parents</p>
      </div>

      {loading ? (
        <p>Loading inquiries...</p>
      ) : (
        <div className="inquiries-layout">
          <div className="inquiries-list">
            {inquiries.length === 0 ? (
              <div className="empty-state">
                <p>No inquiries yet</p>
              </div>
            ) : (
              inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className={`inquiry-card ${selectedInquiry?.id === inquiry.id ? 'selected' : ''}`}
                  onClick={() => setSelectedInquiry(inquiry)}
                >
                  <div className="inquiry-header">
                    <h4>{inquiry.parentName}</h4>
                    <span 
                      className="status-badge"
                      style={getStatusBadge(inquiry.status)}
                    >
                      {inquiry.status}
                    </span>
                  </div>
                  <p className="inquiry-preview">{inquiry.message.substring(0, 80)}...</p>
                  <div className="inquiry-meta">
                    <span>{inquiry.program || 'General'}</span>
                    <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedInquiry && (
            <div className="inquiry-detail">
              <div className="detail-header">
                <h2>{selectedInquiry.parentName}</h2>
                <button onClick={() => setSelectedInquiry(null)}>×</button>
              </div>
              
              <div className="detail-info">
                <p><strong>Email:</strong> {selectedInquiry.email}</p>
                <p><strong>Phone:</strong> {selectedInquiry.phone}</p>
                {selectedInquiry.childName && (
                  <p><strong>Child:</strong> {selectedInquiry.childName} ({selectedInquiry.childAge})</p>
                )}
                <p><strong>Program:</strong> {selectedInquiry.program || 'General'}</p>
                <p><strong>Received:</strong> {new Date(selectedInquiry.createdAt).toLocaleString()}</p>
              </div>

              <div className="detail-message">
                <h4>Message</h4>
                <p>{selectedInquiry.message}</p>
              </div>

              {selectedInquiry.replies?.length > 0 && (
                <div className="detail-replies">
                  <h4>Previous Replies</h4>
                  {selectedInquiry.replies.map((reply) => (
                    <div key={reply.id} className="reply-item">
                      <p>{reply.message}</p>
                      <span>{new Date(reply.sentAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="reply-form">
                <h4>Send Reply</h4>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows="4"
                />
                <button onClick={handleReply} className="btn btn-primary">
                  Send Reply
                </button>
                <p className="reply-note">
                  * In demo mode, replies are saved but emails are not sent
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Content Panel (Placeholder)
const ContentPanel = () => (
  <div className="admin-page">
    <div className="admin-header">
      <h1>Content Management</h1>
      <p>Edit your website content</p>
    </div>
    <div className="placeholder-panel">
      <div className="placeholder-icon">📝</div>
      <h3>Content Editor</h3>
      <p>This feature will allow you to edit:</p>
      <ul>
        <li>Homepage hero text and images</li>
        <li>Program descriptions</li>
        <li>About page content</li>
        <li>Staff profiles</li>
        <li>Testimonials</li>
      </ul>
      <p className="placeholder-note">Full functionality available upon project approval</p>
    </div>
  </div>
);

// Gallery Panel (Placeholder)
const GalleryPanel = () => (
  <div className="admin-page">
    <div className="admin-header">
      <h1>Gallery Management</h1>
      <p>Upload and manage photos</p>
    </div>
    <div className="placeholder-panel">
      <div className="placeholder-icon">🖼️</div>
      <h3>Photo Gallery Manager</h3>
      <p>This feature will allow you to:</p>
      <ul>
        <li>Upload new photos</li>
        <li>Add captions and categories</li>
        <li>Reorder gallery images</li>
        <li>Delete photos</li>
      </ul>
      <p className="placeholder-note">Full functionality available upon project approval</p>
    </div>
  </div>
);

// Pricing Panel (Placeholder)
const PricingPanel = () => (
  <div className="admin-page">
    <div className="admin-header">
      <h1>Pricing Management</h1>
      <p>Update program pricing</p>
    </div>
    <div className="placeholder-panel">
      <div className="placeholder-icon">💰</div>
      <h3>Pricing Editor</h3>
      <p>This feature will allow you to:</p>
      <ul>
        <li>Set pricing for each program</li>
        <li>Configure full-time and part-time rates</li>
        <li>Add promotional pricing</li>
        <li>Toggle price visibility on website</li>
      </ul>
      <p className="placeholder-note">Full functionality available upon project approval</p>
    </div>
  </div>
);

// Settings Panel (Placeholder)
const SettingsPanel = () => (
  <div className="admin-page">
    <div className="admin-header">
      <h1>Settings</h1>
      <p>Configure your website</p>
    </div>
    <div className="placeholder-panel">
      <div className="placeholder-icon">⚙️</div>
      <h3>Site Settings</h3>
      <p>This feature will allow you to:</p>
      <ul>
        <li>Update contact information</li>
        <li>Change hours of operation</li>
        <li>Manage admin users</li>
        <li>Configure email notifications</li>
        <li>Connect parent portal</li>
      </ul>
      <p className="placeholder-note">Full functionality available upon project approval</p>
    </div>
  </div>
);

export default AdminDashboard;
