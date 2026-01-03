import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPostNotificationsApi, markNotificationAsReadApi } from '../config/api';
import Toast from 'react-native-toast-message';

interface Notification {
  id: number;
  title: string;
  message: string;
  fullMessage?: string;
  time: string;
  date: string;
  read: boolean;
  icon: string;
  iconColor: string;
  category: 'fee' | 'notice' | 'exam' | 'event' | 'general';
}

export default function NotificationDetails() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedNotification, setExpandedNotification] = useState<number | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const getCurrentYear = () => new Date().getFullYear();

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryFromTitle = (title: string): Notification['category'] => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('fee') || lowerTitle.includes('payment')) return 'fee';
    if (lowerTitle.includes('exam') || lowerTitle.includes('test')) return 'exam';
    if (lowerTitle.includes('notice') || lowerTitle.includes('announcement')) return 'notice';
    if (lowerTitle.includes('event') || lowerTitle.includes('sports') || lowerTitle.includes('meeting')) return 'event';
    return 'general';
  };

  const loadNotifications = async () => {
    try {
      const response = await getPostNotificationsApi();
      if (response.success && response.data) {
        const currentYear = getCurrentYear();
        
        // Filter notifications from current year only
        const currentYearNotifications = response.data
          .filter((item: any) => {
            const notificationYear = new Date(item.created_at).getFullYear();
            return notificationYear === currentYear;
          })
          .map((item: any, index: number) => ({
            id: item.id,
            title: item.name,
            message: item.description || 'New notification',
            fullMessage: item.description || 'New notification',
            time: getTimeAgo(item.created_at),
            date: formatDate(item.created_at),
            read: item.is_read || false,
            icon: 'notifications-outline',
            iconColor: index % 5 === 0 ? '#DC2626' : 
                      index % 5 === 1 ? '#2563EB' : 
                      index % 5 === 2 ? '#16A34A' : 
                      index % 5 === 3 ? '#F59E0B' : '#8B5CF6',
            category: getCategoryFromTitle(item.name),
          }))
          .sort((a: any, b: any) => {
            // Sort by created_at date (newest first)
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
        
        setNotifications(currentYearNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load notifications',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsReadApi(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const toggleExpand = (id: number) => {
    if (expandedNotification === id) {
      setExpandedNotification(null);
    } else {
      setExpandedNotification(id);
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        markAsRead(id);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getCategoryBadge = (category: string) => {
    const badges = {
      fee: { label: 'Fee', color: '#DC2626' },
      notice: { label: 'Notice', color: '#2563EB' },
      exam: { label: 'Exam', color: '#16A34A' },
      event: { label: 'Event', color: '#F59E0B' },
      general: { label: 'General', color: '#6B7280' },
    };
    return badges[category as keyof typeof badges] || badges.general;
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className={`px-4 py-4 flex-row items-center shadow-sm ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center mr-3"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Notifications {getCurrentYear()}
          </Text>
          {unreadCount > 0 && (
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {unreadCount} unread
            </Text>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#DC2626']}
            tintColor={isDark ? '#DC2626' : '#DC2626'}
          />
        }
      >
        <View className="px-4 py-2">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const isExpanded = expandedNotification === notification.id;
              const categoryBadge = getCategoryBadge(notification.category);
              const isRead = notification.read;

              return (
                <View
                  key={notification.id}
                  className={`mb-3 rounded-xl overflow-hidden ${
                    isDark ? 'bg-gray-800' : 'bg-white'
                  } ${!isRead ? (isDark ? 'border-2 border-blue-500/30' : 'border-2 border-blue-500/20') : ''}`}
                >
                  <TouchableOpacity
                    onPress={() => toggleExpand(notification.id)}
                    className="p-4"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start">
                      {/* Icon */}
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: notification.iconColor + '20' }}
                      >
                        <Ionicons
                          name={notification.icon as any}
                          size={24}
                          color={notification.iconColor}
                        />
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between mb-1">
                          <Text className={`text-base font-bold flex-1 ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                            {notification.title}
                          </Text>
                          {!isRead && (
                            <View className="w-2.5 h-2.5 bg-blue-500 rounded-full ml-2 mt-1" />
                          )}
                        </View>

                        {/* Category Badge */}
                        <View
                          className="self-start px-2 py-1 rounded-full mb-2"
                          style={{ backgroundColor: categoryBadge.color + '20' }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: categoryBadge.color }}
                          >
                            {categoryBadge.label}
                          </Text>
                        </View>

                        {/* Message Preview */}
                        <Text className={`text-sm mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`} numberOfLines={isExpanded ? undefined : 2}>
                          {isExpanded ? notification.fullMessage : notification.message}
                        </Text>

                        {/* Time and Date */}
                        <View className="flex-row items-center">
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={isDark ? '#9CA3AF' : '#6B7280'}
                          />
                          <Text className={`text-xs ml-1 ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {notification.time} • {notification.date}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Expand/Collapse Indicator */}
                    <View className="flex-row items-center justify-center mt-3">
                      <View className={`h-1 w-12 rounded-full ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`} />
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={isDark ? '#9CA3AF' : '#6B7280'}
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View className="items-center justify-center py-20">
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color={isDark ? '#4B5563' : '#9CA3AF'}
              />
              <Text className={`text-lg font-semibold mt-4 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No notifications
              </Text>
              <Text className={`text-sm mt-2 ${
                isDark ? 'text-gray-500' : 'text-gray-500'
              }`}>
                You have no notifications from {getCurrentYear()}.
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}