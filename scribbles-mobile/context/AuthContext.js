import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const BACKGROUND_TIMEOUT_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const backgroundTimeRef = useRef(null);

  // Track app background/foreground for inactivity timeout
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimeRef.current = Date.now();
        await SecureStore.setItemAsync('lastBackgroundTime', String(Date.now())).catch(() => {});
      } else if (nextState === 'active') {
        try {
          const stored = await SecureStore.getItemAsync('lastBackgroundTime');
          if (stored) {
            const elapsed = Date.now() - parseInt(stored, 10);
            if (elapsed > BACKGROUND_TIMEOUT_MS) {
              await logout();
            }
          }
        } catch (e) {
          // ignore
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // Restore session on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check if background timeout has elapsed
        const lastBg = await SecureStore.getItemAsync('lastBackgroundTime');
        if (lastBg && Date.now() - parseInt(lastBg, 10) > BACKGROUND_TIMEOUT_MS) {
          await SecureStore.deleteItemAsync('accessToken').catch(() => {});
          await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
          await SecureStore.deleteItemAsync('user').catch(() => {});
          await SecureStore.deleteItemAsync('lastBackgroundTime').catch(() => {});
          setLoading(false);
          return;
        }

        const storedUser = await SecureStore.getItemAsync('user');
        const accessToken = await SecureStore.getItemAsync('accessToken');

        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
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
    await SecureStore.deleteItemAsync('lastBackgroundTime').catch(() => {});

    setUser(userData);
    return userData;
  };

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('accessToken').catch(() => {});
    await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
    await SecureStore.deleteItemAsync('user').catch(() => {});
    await SecureStore.deleteItemAsync('lastBackgroundTime').catch(() => {});
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
