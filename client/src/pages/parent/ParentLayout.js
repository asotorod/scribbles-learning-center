import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ParentLayout.css';

const ParentLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/parent', label: 'Dashboard', icon: '🏠', exact: true },
    { path: '/parent/children', label: 'My Children', icon: '👶' },
    { path: '/parent/report-absence', label: 'Report Absence', icon: '📝' },
    { path: '/parent/absences', label: 'Absence History', icon: '📅' },
    { path: '/parent/account', label: 'My Account', icon: '⚙️' },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="parent-layout">
      {/* Header */}
      <header className="parent-header">
        <div className="header-container">
          <Link to="/parent" className="header-logo">
            <img src="/logo.png" alt="Scribbles" />
            <span>Parent Portal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav desktop-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="header-user">
            <span className="user-name">
              {user?.firstName || user?.first_name || user?.name || 'Parent'}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="header-nav mobile-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
            <button className="nav-link logout-link" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Sign Out</span>
            </button>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="parent-main">
        <div className="parent-container">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="parent-footer">
        <p>Scribbles Learning Center | (201) 945-9445 | <a href="/">Visit Website</a></p>
      </footer>
    </div>
  );
};

export default ParentLayout;
