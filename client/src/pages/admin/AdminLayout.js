import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const WARN_TIMEOUT = 25 * 60 * 1000; // 25 minutes
const LOGOUT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const warnTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/admin/login');
  }, [logout, navigate]);

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowTimeoutWarning(false);

    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    warnTimerRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, WARN_TIMEOUT);

    logoutTimerRef.current = setTimeout(() => {
      handleLogout();
    }, LOGOUT_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    resetTimers();

    const events = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    const onActivity = () => {
      if (Date.now() - lastActivityRef.current > 1000) {
        resetTimers();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, onActivity));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [resetTimers]);

  const menuItems = [
    { path: '/admin', icon: '🏠', label: 'Dashboard', exact: true },
    { path: '/admin/children', icon: '👶', label: 'Children' },
    { path: '/admin/parents', icon: '👨‍👩‍👧', label: 'Parents' },
    { path: '/admin/attendance', icon: '📋', label: 'Attendance' },
    { path: '/admin/hr', icon: '👥', label: 'HR' },
    { path: '/admin/content', icon: '📝', label: 'Content' },
    { path: '/admin/reports', icon: '📊', label: 'Reports' },
    ...(user?.role === 'super_admin'
      ? [{ path: '/admin/audit-log', icon: '🔒', label: 'Audit Log' }]
      : []),
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Session Expiring Modal */}
      {showTimeoutWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 32, maxWidth: 400, textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#9200;</div>
            <h2 style={{ margin: '0 0 12px' }}>Session Expiring</h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
              Your session will expire in 5 minutes due to inactivity. Move your mouse or press any key to stay logged in.
            </p>
            <button
              onClick={resetTimers}
              className="btn btn-primary"
              style={{ padding: '10px 32px', fontSize: 14 }}
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="mobile-logo">
          <img src="/logo.png" alt="Scribbles" />
          <span>Admin</span>
        </div>
        <button className="mobile-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="Scribbles" className="sidebar-logo" />
          {!sidebarCollapsed && <span className="sidebar-title">Scribbles Admin</span>}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '\u2192' : '\u2190'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="sidebar-user">
              <div className="user-avatar">
                {user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'A'}
              </div>
              <div className="user-info">
                <p className="user-name">{user?.first_name || user?.name || 'Admin'}</p>
                <p className="user-role">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Administrator'}
                </p>
              </div>
            </div>
          )}
          <button
            className="logout-btn"
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            {sidebarCollapsed ? '🚪' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
