import { Stack } from 'expo-router';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import notificationService from '../config/notificationService';
import '../global.css';

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();

    return () => {
      notificationService.removeListeners();
    };
  }, []);

  const setupNotifications = async () => {
    try {
      const token = await notificationService.initialize();

      if (token) {
        console.log('Notifications setup complete');

        notificationService.setupListeners(
          (notification) => {
            const title = notification.request.content.title || 'Notification';
            const body = notification.request.content.body || '';

            Toast.show({
              type: 'info',
              text1: title,
              text2: body,
              position: 'top',
              visibilityTime: 4000,
              autoHide: true,
              topOffset: 50,
            });
          },
          (response) => {
            console.log('Notification tapped:', response);
          }
        );
      } else {
        console.log('Notification setup failed or permission denied');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  return (
    <>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: 'white' }
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="dashboard" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="fees" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="classroutine" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="changepasswords" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="teachers" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="notificationdetails" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="upcooming" 
          options={{ 
            headerShown: false 
          }} 
        />
      </Stack>
      
      {/* Toast Component - Must be at the end */}
      <Toast />
    </>
  );
}