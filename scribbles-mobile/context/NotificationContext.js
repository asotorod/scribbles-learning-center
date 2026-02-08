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
      console.log('[PUSH] ========== PUSH NOTIFICATION REGISTRATION ==========');
      console.log('[PUSH] Step 1: Checking device...');
      console.log('[PUSH] Device.isDevice:', Device.isDevice);
      console.log('[PUSH] Platform:', Platform.OS);

      // Must be physical device for push notifications
      if (!Device.isDevice) {
        console.log('[PUSH] STOPPED: Push notifications require a physical device');
        return;
      }

      // Check existing permission
      console.log('[PUSH] Step 2: Checking notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('[PUSH] Existing permission status:', existingStatus);
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        console.log('[PUSH] Step 2b: Requesting notification permission...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('[PUSH] New permission status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.log('[PUSH] STOPPED: Push notification permission denied');
        return;
      }

      // Log all available config for debugging
      console.log('[PUSH] Step 3: Reading project configuration...');
      console.log('[PUSH] Constants.expoConfig:', JSON.stringify(Constants.expoConfig, null, 2));
      console.log('[PUSH] Constants.manifest:', JSON.stringify(Constants.manifest, null, 2));
      console.log('[PUSH] Constants.manifest2:', JSON.stringify(Constants.manifest2, null, 2));

      // Get push token - try multiple sources for projectId
      let projectId = Constants.expoConfig?.extra?.eas?.projectId;

      // Fallback: try manifest2 (used in newer Expo versions)
      if (!projectId) {
        projectId = Constants.manifest2?.extra?.eas?.projectId;
        console.log('[PUSH] Trying manifest2 for projectId:', projectId);
      }

      // Fallback: try manifest (used in older Expo versions)
      if (!projectId) {
        projectId = Constants.manifest?.extra?.eas?.projectId;
        console.log('[PUSH] Trying manifest for projectId:', projectId);
      }

      console.log('[PUSH] Final projectId:', projectId);

      if (!projectId) {
        console.error('[PUSH] ERROR: No projectId found in any config!');
        console.error('[PUSH] Available in Constants.expoConfig.extra:', Constants.expoConfig?.extra);
        console.error('[PUSH] You need to:');
        console.error('[PUSH]   1. Run: eas login');
        console.error('[PUSH]   2. Run: eas project:info');
        console.error('[PUSH]   3. Add the projectId to app.json under extra.eas.projectId');
        console.error('[PUSH]   4. Rebuild the app with: eas build --platform ios');
        return;
      }

      console.log('[PUSH] Step 4: Getting Expo push token with projectId:', projectId);
      let token;
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
        console.log('[PUSH] SUCCESS: Got Expo push token:', token);
      } catch (tokenError) {
        console.error('[PUSH] ERROR getting push token:', tokenError.message);
        console.error('[PUSH] This usually means the projectId is invalid or mismatched');
        console.error('[PUSH] Current projectId:', projectId);
        return;
      }

      setExpoPushToken(token);

      // Save token to backend
      console.log('[PUSH] Step 5: Saving token to backend...');
      console.log('[PUSH] API URL: POST /portal/push-token');
      console.log('[PUSH] Token being sent:', token);
      console.log('[PUSH] User ID:', user?.id);
      console.log('[PUSH] User email:', user?.email);

      try {
        const response = await portalAPI.savePushToken(token);
        console.log('[PUSH] SUCCESS: Token saved to backend!');
        console.log('[PUSH] Response status:', response.status);
        console.log('[PUSH] Response data:', JSON.stringify(response.data));
      } catch (err) {
        console.error('[PUSH] FAILED to save push token to backend!');
        console.error('[PUSH] Error message:', err.message);
        console.error('[PUSH] Error response status:', err.response?.status);
        console.error('[PUSH] Error response data:', JSON.stringify(err.response?.data));
        if (err.response?.status === 401) {
          console.error('[PUSH] 401 Unauthorized - Auth token may be missing or expired');
        }
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        console.log('[PUSH] Step 6: Configuring Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#43a047',
        });
      }

      console.log('[PUSH] ========== REGISTRATION COMPLETE ==========');
    } catch (error) {
      console.error('[PUSH] FATAL ERROR during push notification registration:', error);
      console.error('[PUSH] Error stack:', error.stack);
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
