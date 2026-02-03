import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        const accessToken = await SecureStore.getItemAsync('accessToken');

        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        // Invalid stored data — clear it
        await SecureStore.deleteItemAsync('user').catch(() => {});
        await SecureStore.deleteItemAsync('accessToken').catch(() => {});
        await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const { accessToken, refreshToken, user: userData } =
      response.data?.data || response.data;

    // Only allow parent role
    if (userData.role !== 'parent') {
      throw new Error('This app is for parents only. Please use the admin portal for staff access.');
    }

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));

    setUser(userData);
    return userData;
  };

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('accessToken').catch(() => {});
    await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
    await SecureStore.deleteItemAsync('user').catch(() => {});
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
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
