import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const notificationListener = useRef();
  const responseListener = useRef();

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

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        // Handle navigation based on notification type if needed
        console.log('Notification tapped:', data);
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
  }, []);

  const registerForPushNotifications = async () => {
    try {
      // Must be physical device for push notifications
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return;
      }

      // Check existing permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = tokenData.data;

      setExpoPushToken(token);

      // Save token to backend
      try {
        await portalAPI.savePushToken(token);
        console.log('Push token saved successfully');
      } catch (err) {
        console.error('Failed to save push token:', err);
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
      console.error('Error registering for push notifications:', error);
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
    registerForPushNotifications,
    unregisterPushNotifications,
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
