import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    // Determine which login page to redirect to based on the current path
    const loginPath = location.pathname.startsWith('/parent')
      ? '/login'
      : '/admin/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user's actual role
    if (user.role === 'parent') {
      return <Navigate to="/parent" replace />;
    }
    if (['super_admin', 'admin'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    }
    // Staff or unknown role - go to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
