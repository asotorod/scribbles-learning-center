import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (storedUser && accessToken) {
        setUser(JSON.parse(storedUser));
        // Set default auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Refresh token function
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      return accessToken;
    } catch (error) {
      // Refresh failed, clear auth state
      logout();
      return null;
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { accessToken, refreshToken, user: userData } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));

    // Also store in legacy format for backward compatibility
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminUser', JSON.stringify(userData));

    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setUser(userData);

    return userData;
  };

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  }, [user]);

  // Check if user is admin (super_admin or admin)
  const isAdmin = useCallback(() => {
    return hasRole(['super_admin', 'admin']);
  }, [hasRole]);

  // Check if user is parent
  const isParent = useCallback(() => {
    return hasRole('parent');
  }, [hasRole]);

  // Check if user is staff
  const isStaff = useCallback(() => {
    return hasRole('staff');
  }, [hasRole]);

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await refreshAccessToken();

          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshAccessToken]);

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    isAdmin,
    isParent,
    isStaff,
    isAuthenticated: !!user,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
