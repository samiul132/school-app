import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { getPostNotificationsApi } from '../config/api';
import {
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,  // এটি import করুন
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { customLogoutApi, getSchoolSettingsApi, getUserData } from '../config/api';

interface CommonLayoutProps {
  children: ReactNode;
  title: string;
  currentRoute?: string;
  onRefresh?: () => Promise<void>; 
}

interface SchoolSettings {
  id: number;
  school_name: string;
  address: string;
  mobile_number: string;
  email: string;
  logo: string;
  logo_url: string;
}

export default function CommonLayout({
  children,
  title,
  currentRoute = 'dashboard',
  onRefresh: pageRefresh,
}: CommonLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [schoolInfoOpen, setSchoolInfoOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [userData, setUserData] = useState<any>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const response = await getPostNotificationsApi();
      if (response.success && response.data) {
        const formattedNotifications = response.data.map((item: any, index: number) => ({
          id: item.id,
          title: item.name,
          message: item.description || 'New notification',
          time: getTimeAgo(item.created_at),
          read: false,
          icon: 'notifications-outline',
          iconColor: index % 3 === 0 ? '#DC2626' : index % 3 === 1 ? '#2563EB' : '#16A34A',
        }));
        
        setNotifications(formattedNotifications);
        setNotificationCount(formattedNotifications.length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadUserData();
    loadSchoolSettings();
    loadNotifications(); 
  }, []);

  const loadUserData = async () => {
    try {
      const user = await getUserData();
      if (user) {
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load user data',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const loadSchoolSettings = async () => {
    try {
      const response = await getSchoolSettingsApi();
      if (response.success && response.data) {
        setSchoolSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading school settings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const commonRefresh = Promise.all([
        loadUserData(),
        loadSchoolSettings(),
        loadNotifications(),
      ]);

      if (pageRefresh) {
        await Promise.all([commonRefresh, pageRefresh()]);
      } else {
        await commonRefresh;
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const menuItems = [
    // First Group
    { id: 1, name: 'Dashboard', icon: 'grid-outline', route: '/dashboard' },
    { id: 2, name: 'Fees', icon: 'cash-outline', route: '/fees' },
    { id: 3, name: 'Class Routine', icon: 'calendar-outline', route: '/classroutine' },
    { id: 4, name: 'Notice Board', icon: 'notifications-outline', route: '/upcooming' },
    { id: 5, name: 'Results', icon: 'trophy-outline', route: '/upcooming' },
    { id: 6, name: 'divider' }, 
    
    // Second Group
    { id: 7, name: 'About Us', icon: 'information-circle-outline', route: '/upcooming' },
    { id: 8, name: 'Honorable Teachers', icon: 'people-outline', route: '/teachers' },
    { id: 9, name: 'Board of Directors', icon: 'briefcase-outline', route: '/upcooming' },
    { id: 10, name: 'divider' }, 
    
    // Third Group
    { id: 11, name: 'My Profile', icon: 'person-outline', route: '/profile' },
    { id: 12, name: 'Change Password', icon: 'lock-closed-outline', route: '/changepasswords' },
  ];

  const bottomMenuItems = [
    { id: 1, name: 'Dashboard', icon: 'home-outline', route: '/dashboard' },
    { id: 2, name: 'Fees', icon: 'cash-outline', route: '/fees' },
    { id: 3, name: 'Profile', icon: 'person-outline', route: '/profile' },
  ];

  const handleMenuClick = (route: string) => {
    setMenuOpen(false);
    router.push(route as Href);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await customLogoutApi();
              setMenuOpen(false);
              router.replace('/login' as Href);
              
              Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been logged out successfully',
                position: 'top',
                visibilityTime: 2000,
              });
            } catch (error) {
              console.error('Logout error:', error);
              setMenuOpen(false);
              router.replace('/login' as Href);
              
              Toast.show({
                type: 'info',
                text1: 'Session Ended',
                text2: 'You have been logged out',
                position: 'top',
                visibilityTime: 2000,
              });
            }
          },
        },
      ]
    );
  };

  const getUserInitial = () => {
    if (userData?.name) {
      return userData.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const isActiveRoute = (route: string) => {
    return currentRoute === route.replace('/', '');
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Status Bar - এটি যোগ করুন */}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1F2937' : '#FFFFFF'}
      />

      {/* Header */}
      <View className={`px-4 py-4 flex-row items-center justify-between shadow-sm ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Left */}
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            className="w-10 h-10 items-center justify-center mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="menu-outline" size={28} color={isDark ? '#F9FAFB' : '#374151'} />
          </TouchableOpacity>

          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {title}
          </Text>
        </View>

        {/* Right */}
        <View className="flex-row items-center gap-3">
          {/* Notification */}
          <TouchableOpacity
            onPress={() => setNotificationOpen(true)}
            className="w-10 h-10 items-center justify-center relative"
            activeOpacity={0.7}
          >
            <Ionicons
              name={notificationCount > 0 ? 'notifications' : 'notifications-outline'}
              size={24}
              color={isDark ? '#F9FAFB' : '#374151'}
            />
            {notificationCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1">
                <Text className="text-white text-[10px] font-bold">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* School Logo - Clickable */}
          <TouchableOpacity
            onPress={() => setSchoolInfoOpen(true)}
            className="w-10 h-10 bg-white rounded-full items-center justify-center border-2 border-primary-600 overflow-hidden"
            activeOpacity={0.7}
          >
            {schoolSettings?.logo_url ? (
              <Image
                source={{ uri: schoolSettings.logo_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../assets/images/logo.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content with ScrollView */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#DC2626']}
            tintColor={isDark ? '#DC2626' : '#DC2626'}
            title="Pull to refresh"
            titleColor={isDark ? '#9CA3AF' : '#6B7280'}
          />
        }
      >
        {children}
        
        {/* Footer */}
        <View className="items-center py-6 mt-4">
          <View className="flex-row items-center justify-center">
            <Ionicons name="flash" size={14} color="rgb(180, 50, 180)" />
            <TouchableOpacity
            onPress={() => Linking.openURL('http://designcodeit.com/')}>
              
            <Text className="text-blue-400 text-sm ml-1 text-center">
              Powered by Designcode IT
            </Text>
            </TouchableOpacity>
          </View>
          <Text className={`text-sm font-medium ${
            isDark ? 'text-gray-400' : 'text-red-600'
          }`}>
            Chengarchar Bazar, Matlab Uttar
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('tel:01935102910')}
          >
            <View className="flex-row items-center justify-center mb-2">
              <Ionicons name="call" size={14} color="rgb(180, 50, 180)" />
              <Text className="text-secondary-700 text-xs font-semibold ml-2">
                01935102910
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className={`border-t px-2 py-3 flex-row justify-around items-center shadow-lg ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {bottomMenuItems.map((item) => {
          const isActive = isActiveRoute(item.route);
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleMenuClick(item.route)}
              className={`flex-1 items-center py-2 rounded-xl ${
                isActive 
                  ? (isDark ? 'bg-primary-500/20' : 'bg-primary-50')
                  : ''
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={
                  isActive 
                    ? (isDark ? '#EF4444' : '#DC2626')
                    : (isDark ? '#9CA3AF' : '#4b5563')
                }
              />
              <Text
                className={`text-xs font-medium ${
                  isActive 
                    ? (isDark ? 'text-primary-400' : 'text-primary-600')
                    : (isDark ? 'text-gray-400' : 'text-gray-600')
                }`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* School Info Modal */}
      <Modal
        visible={schoolInfoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSchoolInfoOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setSchoolInfoOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Header with Logo */}
            <View className="bg-primary-600 items-center py-8 px-6">
              <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 shadow-lg overflow-hidden border-4 border-white">
                {schoolSettings?.logo_url ? (
                  <Image
                    source={{ uri: schoolSettings.logo_url }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require('../assets/images/logo.png')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                )}
              </View>
              <Text className="text-white text-2xl font-bold text-center">
                {schoolSettings?.school_name || 'School Name'}
              </Text>
            </View>

            {/* School Information */}
            <View className="p-6">
              {/* Address */}
              {schoolSettings?.address && (
                <View className="flex-row items-start mb-4">
                  <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="location" size={20} color="#DC2626" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs font-semibold mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Address
                    </Text>
                    <Text className={`text-base ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {schoolSettings.address}
                    </Text>
                  </View>
                </View>
              )}

              {/* Phone */}
              {schoolSettings?.mobile_number && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${schoolSettings.mobile_number}`)}
                  className="flex-row items-center mb-4"
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="call" size={20} color="#DC2626" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs font-semibold mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Phone Number
                    </Text>
                    <Text className={`text-base font-medium ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {schoolSettings.mobile_number}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              )}

              {/* Email */}
              {schoolSettings?.email && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`mailto:${schoolSettings.email}`)}
                  className="flex-row items-center mb-4"
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="mail" size={20} color="#DC2626" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs font-semibold mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Email Address
                    </Text>
                    <Text className={`text-base font-medium ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {schoolSettings.email}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              )}

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setSchoolInfoOpen(false)}
                className="bg-primary-600 py-3 rounded-xl mt-2"
                activeOpacity={0.8}
              >
                <Text className="text-white text-center font-semibold text-base">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Notification Dropdown Modal */}
      <Modal
        visible={notificationOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setNotificationOpen(false)}
        >
          <View className="absolute top-16 right-4 left-4 md:left-auto md:w-96">
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className={`rounded-2xl overflow-hidden shadow-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              {/* Header */}
              <View className={`px-4 py-4 border-b ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <Text className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  Notifications
                </Text>
                {notificationCount > 0 && (
                  <Text className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    You have {notificationCount} unread notification{notificationCount > 1 ? 's' : ''}
                  </Text>
                )}
              </View>

              {/* Notification List */}
              <ScrollView 
                className="max-h-96"
                showsVerticalScrollIndicator={false}
              >
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <TouchableOpacity
                      key={notification.id}
                      className={`px-4 py-4 border-b ${
                        isDark ? 'border-gray-700' : 'border-gray-100'
                      } ${!notification.read ? (isDark ? 'bg-gray-700/30' : 'bg-blue-50/50') : ''}`}
                      activeOpacity={0.7}
                      onPress={() => {
                        setNotificationOpen(false);
                        router.push('/notificationdetails' as Href);
                      }}
                    >
                      <View className="flex-row items-start">
                        <View 
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: notification.iconColor + '20' }}
                        >
                          <Ionicons 
                            name={notification.icon as any} 
                            size={20} 
                            color={notification.iconColor} 
                          />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-start justify-between mb-1">
                            <Text className={`text-sm font-semibold flex-1 ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                              {notification.title}
                            </Text>
                            {!notification.read && (
                              <View className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" />
                            )}
                          </View>
                          <Text className={`text-sm mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`} numberOfLines={2}>
                            {notification.message}
                          </Text>
                          <Text className={`text-xs ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {notification.time}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="py-12 items-center">
                    <Ionicons 
                      name="notifications-off-outline" 
                      size={48} 
                      color={isDark ? '#6B7280' : '#9CA3AF'} 
                    />
                    <Text className={`text-base mt-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      No notifications
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer - View More */}
              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setNotificationOpen(false);
                    router.push('/notificationdetails' as Href);
                  }}
                  className={`px-4 py-4 border-t items-center ${
                    isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-sm font-semibold ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    View More
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Side Menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View className="flex-1 flex-row">
          {/* Sidebar */}
          <View className={`w-80 h-full shadow-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header Section */}
            <View className="bg-primary-600 px-6 py-8 items-center">
              <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 border-2 border-white overflow-hidden shadow-lg">
                <Image
                  source={require('../assets/images/logo.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <Text className="text-white text-xl font-bold text-center">
                {userData?.name || 'User'}
              </Text>
              <Text className="text-white/90 text-sm mt-1 text-center">
                {userData?.user_name || 'Student'}
              </Text>
            </View>

            {/* Menu Items */}
            <ScrollView className="flex-1 py-4">
              {menuItems.map((item) => {
                // Render divider
                if (item.name === 'divider') {
                  return (
                    <View 
                      key={item.id} 
                      className={`h-px my-2 mx-6 ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`} 
                    />
                  );
                }

                const isActive = isActiveRoute(item.route!);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleMenuClick(item.route!)}
                    className={`flex-row items-center px-6 py-4 ${
                      isActive
                        ? (isDark 
                            ? 'bg-primary-500/20 border-l-4 border-primary-500' 
                            : 'bg-primary-50 border-l-4 border-primary-600')
                        : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={
                        isActive 
                          ? (isDark ? '#EF4444' : '#DC2626')
                          : (isDark ? '#D1D5DB' : '#374151')
                      }
                      style={{ marginRight: 16 }}
                    />
                    <Text
                      className={`text-base font-medium flex-1 ${
                        isActive
                          ? (isDark ? 'text-primary-400' : 'text-primary-600')
                          : (isDark ? 'text-gray-200' : 'text-gray-700')
                      }`}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Divider before logout */}
              <View className={`h-px my-2 mx-6 ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`} />

              {/* Logout Button */}
              <TouchableOpacity
                onPress={handleLogout}
                className="flex-row items-center px-6 py-4"
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="log-out-outline" 
                  size={24} 
                  color="#ef4444" 
                  style={{ marginRight: 16 }}
                />
                <Text className="text-base font-medium text-red-600">Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Overlay */}
          <TouchableOpacity
            className="flex-1 bg-black/50"
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}