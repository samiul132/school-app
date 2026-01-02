// config/notificationService.ts
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { savePushTokenApi, removePushTokenApi } from './api';

// Only setup notification handler on mobile platforms
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

class NotificationService {
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Push notification setup এবং token register করুন
   */
  async initialize() {
    try {
      // Skip on web platform
      if (Platform.OS === 'web') {
        console.log('Push notifications not supported on web');
        return null;
      }

      // Check if physical device
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Android notification channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#DC2626',
        });
      }

      // Permission request করুন
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Expo push token পান
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      const token = tokenData.data;

      console.log('✅ Expo Push Token:', token);

      // Backend এ token save করুন
      await savePushTokenApi(token);
      console.log('✅ Token saved to backend');

      return token;
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      return null;
    }
  }

  /**
   * Notification listeners setup করুন
   */
  setupListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void
  ) {
    // Foreground notification listener
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Notification tap listener
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });
  }

  /**
   * Listeners remove করুন
   */
  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Token remove করুন (logout time এ)
   */
  async removeToken() {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      const token = tokenData.data;

      await removePushTokenApi(token);
      console.log('✅ Token removed from backend');
    } catch (error) {
      console.error('❌ Error removing token:', error);
    }
  }
}

export default new NotificationService();