import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Sample notifications - replace with API call
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Fee Payment Reminder',
      message: 'Your monthly fee payment is due in 3 days',
      fullMessage: 'Dear Student, this is a reminder that your monthly tuition fee for December 2025 is due in 3 days. Please make the payment before the due date to avoid late fees. You can pay online or visit the school office.',
      time: '2 hours ago',
      date: 'Dec 23, 2025',
      read: false,
      icon: 'cash-outline',
      iconColor: '#DC2626',
      category: 'fee',
    },
    {
      id: 2,
      title: 'New Notice Published',
      message: 'Check the notice board for important updates',
      fullMessage: 'A new notice has been published on the notice board regarding the upcoming winter break schedule. All students are requested to check the notice board for complete details.',
      time: '5 hours ago',
      date: 'Dec 23, 2025',
      read: false,
      icon: 'document-text-outline',
      iconColor: '#2563EB',
      category: 'notice',
    },
    {
      id: 3,
      title: 'Exam Schedule Updated',
      message: 'Mid-term exam schedule has been updated',
      fullMessage: 'The mid-term examination schedule has been revised. The new dates are: Math - Jan 5, Science - Jan 7, English - Jan 9. Please check the updated schedule on the school website.',
      time: '1 day ago',
      date: 'Dec 22, 2025',
      read: true,
      icon: 'calendar-outline',
      iconColor: '#16A34A',
      category: 'exam',
    },
    {
      id: 4,
      title: 'Sports Day Event',
      message: 'Annual sports day scheduled for next month',
      fullMessage: 'We are excited to announce that our Annual Sports Day will be held on January 15, 2026. All students are encouraged to participate. Registration forms are available at the sports office.',
      time: '2 days ago',
      date: 'Dec 21, 2025',
      read: true,
      icon: 'trophy-outline',
      iconColor: '#F59E0B',
      category: 'event',
    },
    {
      id: 5,
      title: 'Parent-Teacher Meeting',
      message: 'Scheduled for next week',
      fullMessage: 'Dear Parents and Students, a parent-teacher meeting has been scheduled for December 28, 2025, from 10:00 AM to 2:00 PM. Please ensure your attendance to discuss academic progress.',
      time: '3 days ago',
      date: 'Dec 20, 2025',
      read: true,
      icon: 'people-outline',
      iconColor: '#8B5CF6',
      category: 'event',
    },
  ]);

  const [expandedNotification, setExpandedNotification] = useState<number | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    // Keep the notification expanded after marking as read
    // Don't close it, just update the state
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    // Close any expanded notification
    setExpandedNotification(null);
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const toggleExpand = (id: number) => {
    if (expandedNotification === id) {
      setExpandedNotification(null);
    } else {
      setExpandedNotification(id);
      markAsRead(id);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

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
      <View className={`px-4 py-4 flex-row items-center justify-between shadow-sm ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#F9FAFB' : '#374151'} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {unreadCount} unread
              </Text>
            )}
          </View>
        </View>

        {/* Mark All as Read */}
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            className="px-3 py-2"
            activeOpacity={0.7}
          >
            <Text className={`text-sm font-semibold ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View className={`px-4 py-3 flex-row gap-3 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          className={`flex-1 py-2 px-4 rounded-lg ${
            filter === 'all'
              ? (isDark ? 'bg-primary-500' : 'bg-primary-600')
              : (isDark ? 'bg-gray-700' : 'bg-gray-100')
          }`}
          activeOpacity={0.7}
        >
          <Text className={`text-center font-semibold ${
            filter === 'all'
              ? 'text-white'
              : (isDark ? 'text-gray-300' : 'text-gray-700')
          }`}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('unread')}
          className={`flex-1 py-2 px-4 rounded-lg ${
            filter === 'unread'
              ? (isDark ? 'bg-primary-500' : 'bg-primary-600')
              : (isDark ? 'bg-gray-700' : 'bg-gray-100')
          }`}
          activeOpacity={0.7}
        >
          <Text className={`text-center font-semibold ${
            filter === 'unread'
              ? 'text-white'
              : (isDark ? 'text-gray-300' : 'text-gray-700')
          }`}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-4 py-2">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const isExpanded = expandedNotification === notification.id;
              const categoryBadge = getCategoryBadge(notification.category);
              
              // Find the notification in the original array to check read status
              const currentNotification = notifications.find(n => n.id === notification.id);
              const isRead = currentNotification?.read || false;

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

                  {/* Action Buttons */}
                  {isExpanded && (
                    <View className={`flex-row border-t px-4 py-3 gap-2 ${
                      isDark ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      {!isRead && (
                        <TouchableOpacity
                          onPress={() => {
                            markAsRead(notification.id);
                          }}
                          className={`flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-lg ${
                            isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                          }`}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color={isDark ? '#60A5FA' : '#2563EB'}
                          />
                          <Text className={`ml-2 font-semibold text-sm ${
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            Mark Read
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => {
                          deleteNotification(notification.id);
                          if (expandedNotification === notification.id) {
                            setExpandedNotification(null);
                          }
                        }}
                        className={`${!isRead ? 'flex-1' : 'flex-1'} flex-row items-center justify-center py-2.5 px-4 rounded-lg ${
                          isDark ? 'bg-red-500/20' : 'bg-red-50'
                        }`}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={isDark ? '#F87171' : '#DC2626'}
                        />
                        <Text className={`ml-2 font-semibold text-sm ${
                          isDark ? 'text-red-400' : 'text-red-600'
                        }`}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
                {filter === 'unread'
                  ? 'All caught up! No unread notifications.'
                  : 'You have no notifications at the moment.'}
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