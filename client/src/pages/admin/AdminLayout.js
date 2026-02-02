import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin', icon: '🏠', label: 'Dashboard', exact: true },
    { path: '/admin/children', icon: '👶', label: 'Children' },
    { path: '/admin/parents', icon: '👨‍👩‍👧', label: 'Parents' },
    { path: '/admin/attendance', icon: '📋', label: 'Attendance' },
    { path: '/admin/hr', icon: '👥', label: 'HR' },
    { path: '/admin/content', icon: '📝', label: 'Content' },
    { path: '/admin/reports', icon: '📊', label: 'Reports' },
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
            {sidebarCollapsed ? '→' : '←'}
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
