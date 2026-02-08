import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { portalAPI } from '../services/api';
import { useAuth } from './AuthContext';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [lastAttendanceUpdate, setLastAttendanceUpdate] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const refreshCallbacksRef = useRef([]);

  // Register for push notifications when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      registerForPushNotifications();
    }

    return () => {
      // Clean up listeners
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (err) {
        console.log('Error cleaning up notification listeners:', err);
      }
    };
  }, [isAuthenticated, user]);

  // Register a callback to be called when attendance updates
  const registerRefreshCallback = useCallback((callback) => {
    refreshCallbacksRef.current.push(callback);
    // Return unregister function
    return () => {
      refreshCallbacksRef.current = refreshCallbacksRef.current.filter(cb => cb !== callback);
    };
  }, []);

  // Trigger all registered refresh callbacks
  const triggerAttendanceRefresh = useCallback(() => {
    console.log('[PUSH] Triggering attendance refresh for all registered callbacks');
    setLastAttendanceUpdate(new Date().toISOString());
    refreshCallbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (err) {
        console.error('[PUSH] Error calling refresh callback:', err);
      }
    });
  }, []);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notif) => {
        console.log('[PUSH] Notification received:', notif.request.content);
        setNotification(notif);

        // Check if this is a check-in/check-out notification
        const data = notif.request.content.data;
        if (data?.type === 'check_in' || data?.type === 'check_out') {
          console.log('[PUSH] Attendance notification detected, triggering refresh');
          triggerAttendanceRefresh();
        }
      }
    );

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('[PUSH] Notification tapped:', data);

        // Trigger refresh when user taps on attendance notification
        if (data?.type === 'check_in' || data?.type === 'check_out') {
          triggerAttendanceRefresh();
        }
      }
    );

    return () => {
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (err) {
        console.log('Error cleaning up notification listeners:', err);
      }
    };
  }, [triggerAttendanceRefresh]);

  const registerForPushNotifications = async () => {
    try {
      console.log('[PUSH] Starting push notification registration...');
      console.log('[PUSH] Device.isDevice:', Device.isDevice);

      // Must be physical device for push notifications
      if (!Device.isDevice) {
        console.log('[PUSH] Push notifications require a physical device');
        return;
      }

      // Check existing permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('[PUSH] Existing permission status:', existingStatus);
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        console.log('[PUSH] Requesting notification permission...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('[PUSH] New permission status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.log('[PUSH] Push notification permission denied');
        return;
      }

      // Get push token - projectId is REQUIRED for standalone/TestFlight builds
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      console.log('[PUSH] EAS Project ID:', projectId);

      if (!projectId) {
        console.error('[PUSH] ERROR: No projectId found! Add extra.eas.projectId to app.json');
        console.error('[PUSH] Get your projectId from expo.dev dashboard');
        return;
      }

      console.log('[PUSH] Getting push token with projectId:', projectId);
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      console.log('[PUSH] Got Expo push token:', token);

      setExpoPushToken(token);

      // Save token to backend
      try {
        console.log('[PUSH] Saving token to backend...');
        console.log('[PUSH] Token being sent:', token);
        console.log('[PUSH] User authenticated:', !!user);
        const response = await portalAPI.savePushToken(token);
        console.log('[PUSH] Token saved successfully!');
        console.log('[PUSH] Response status:', response.status);
        console.log('[PUSH] Response data:', JSON.stringify(response.data));
      } catch (err) {
        console.error('[PUSH] Failed to save push token!');
        console.error('[PUSH] Error message:', err.message);
        console.error('[PUSH] Error response status:', err.response?.status);
        console.error('[PUSH] Error response data:', JSON.stringify(err.response?.data));
        console.error('[PUSH] Full error:', err);
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#43a047',
        });
      }
    } catch (error) {
      console.error('[PUSH] Error registering for push notifications:', error);
    }
  };

  const unregisterPushNotifications = async () => {
    if (expoPushToken) {
      try {
        await portalAPI.removePushToken();
        setExpoPushToken(null);
        console.log('Push token removed successfully');
      } catch (err) {
        console.error('Failed to remove push token:', err);
      }
    }
  };

  const value = {
    expoPushToken,
    notification,
    lastAttendanceUpdate,
    registerForPushNotifications,
    unregisterPushNotifications,
    registerRefreshCallback,
    triggerAttendanceRefresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
