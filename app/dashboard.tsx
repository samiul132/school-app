import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import CommonLayout from '../components/CommonLayout';
import { 
  getStudentProfileByIdApi, 
  getUserData,
  getStudentFeeSummaryApi,
  apiRequest,
  getAppSlidersApi,
  getSliderImageUrl,
} from '../config/api';

import '../global.css';

const { width } = Dimensions.get('window');

interface AppSlider {
  id: number;
  title: string;
  image: string;
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [feeStats, setFeeStats] = useState({
    totalDue: 0,
  });
  const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
  const [attendancePercentage, setAttendancePercentage] = useState('0');
  const [sliderImages, setSliderImages] = useState<AppSlider[]>([]);
  const [loadingSliders, setLoadingSliders] = useState(true);

  useEffect(() => {
    loadUserData();
    loadSliders();
  }, []);

  useEffect(() => {
    // Only start auto-scroll if we have sliders
    if (sliderImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % sliderImages.length;
        scrollViewRef.current?.scrollTo({
          x: next * (width - 32),
          animated: true,
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const loadSliders = async () => {
    try {
      setLoadingSliders(true);
      const response = await getAppSlidersApi();
      
      if (response.success && response.data) {
        let slidersData = [];
        
        // Handle different response structures
        if (Array.isArray(response.data)) {
          slidersData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          slidersData = response.data.data;
        } else if (response.data.data) {
          slidersData = [response.data.data];
        } else {
          slidersData = [response.data];
        }
        
        if (slidersData.length > 0) {
          setSliderImages(slidersData);
        } else {
          // Fallback to default sliders if no data
          setSliderImages([
            {
              id: 1,
              title: 'Welcome to School',
              image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
            },
          ]);
        }
      } else {
        // Fallback to default sliders if API fails
        setSliderImages([
          {
            id: 1,
            title: 'Welcome to School',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading sliders:', error);
      // Fallback to default sliders
      setSliderImages([
        {
          id: 1,
          title: 'Welcome to School',
          image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
        },
      ]);
    } finally {
      setLoadingSliders(false);
    }
  };

  const loadUserData = async () => {
    try {
      const user = await getUserData();
      if (user) {
        setUserData(user);
        
        if (user.type === 'STUDENT' && user.student_id) {
          const studentResponse = await getStudentProfileByIdApi(user.student_id);
          if (studentResponse.success) {
            setStudentData(studentResponse.data);
            
            const classWiseStudentId = studentResponse.data.class_wise_data?.[0]?.id;
            const classId = studentResponse.data.class_wise_data?.[0]?.class?.id;
            const sectionId = studentResponse.data.class_wise_data?.[0]?.section?.id;
            
            if (classWiseStudentId) {
              loadFeeSummary(classWiseStudentId);
              loadAttendanceData(classWiseStudentId);
            }
            
            if (classId && sectionId) {
              loadClassRoutines(classId, sectionId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadFeeSummary = async (classWiseStudentId: number) => {
    try {
      const feeSummary = await getStudentFeeSummaryApi(classWiseStudentId);
      if (feeSummary.success) {
        setFeeStats({
          totalDue: feeSummary.data.total_due,
        });
      }
    } catch (error) {
      console.error('Error loading fee summary:', error);
    }
  };

  const loadAttendanceData = async (classWiseStudentId: number) => {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const token = await AsyncStorage.default.getItem('auth_token');
      
      const response = await fetch(
        `https://smartcampus.designcodeit.com/api/student-attendance?class_wise_student_id=${classWiseStudentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.data.data) {
        const attendanceRecords = data.data.data;
        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(
          (record: any) => record.status === 'Present'
        ).length;
        
        const percentage = totalDays > 0 
          ? Math.round((presentDays / totalDays) * 100) 
          : 0;
        
        setAttendancePercentage(percentage.toString());
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      setAttendancePercentage('95');
    }
  };

  const loadClassRoutines = async (classId: number, sectionId: number) => {
    try {
      const response = await apiRequest('/class-routines', 'GET');
      
      if (response.success) {
        let routinesData = [];
        
        if (response.data?.data) {
          routinesData = Array.isArray(response.data.data) 
            ? response.data.data 
            : [response.data.data];
        } else if (response.data) {
          routinesData = Array.isArray(response.data) 
            ? response.data 
            : [response.data];
        }
        
        const studentRoutine = routinesData.find(
          (routine: any) => routine.class_id === classId && routine.section_id === sectionId
        );
        
        if (studentRoutine && studentRoutine.details) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const today = days[new Date().getDay()];
          
          const offDays = studentRoutine.off_day 
            ? studentRoutine.off_day.split(',').map((d: string) => d.trim()) 
            : [];
          
          if (offDays.includes(today)) {
            setTodaysClasses([
              { id: 0, subject: 'No classes today (Off Day)', time: '', room: '' }
            ]);
            return;
          }
          
          const todayDetails = studentRoutine.details.filter(
            (detail: any) => detail.day_name === today
          );
          
          if (todayDetails.length > 0) {
            const sortedDetails = todayDetails.sort((a: any, b: any) => 
              parseInt(String(a.period_number)) - parseInt(String(b.period_number))
            );
            
            const formattedClasses = sortedDetails.map((detail: any) => ({
              id: detail.id,
              subject: detail.subject?.subject_name || 'Subject',
              time: detail.time || 'N/A',
              room: `Period ${detail.period_number}`,
              teacher: detail.teacher 
                ? `${detail.teacher.first_name} ${detail.teacher.last_name || ''}`.trim()
                : '',
            }));
            
            setTodaysClasses(formattedClasses);
          } else {
            setTodaysClasses([
              { id: 0, subject: 'No classes scheduled for today', time: '', room: '' }
            ]);
          }
        } else {
          setTodaysClasses([
            { id: 0, subject: 'No routine available', time: '', room: '' }
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading class routines:', error);
      setTodaysClasses([
        { id: 0, subject: 'Unable to load schedule', time: '', room: '' }
      ]);
    }
  };

  const handleRefresh = async () => {
    await loadUserData();
    await loadSliders();
  };

  const handleCardClick = (cardId: number) => {
    if (cardId === 3) {
      router.push('/fees' as Href);
    } else if (cardId === 4) {
      router.push('/classroutine' as Href);
    } else if (cardId === 1) {
      router.push('/attendance' as Href);
    } else if (cardId === 2) {
      router.push('/upcooming' as Href);
    }
  };

  const dashboardCards = [
    {
      id: 1,
      title: 'Attendance',
      value: `${attendancePercentage}%`,
      icon: 'calendar',
      color: isDark ? '#EF4444' : '#DC2626',
      bgColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.08)',
    },
    {
      id: 2,
      title: 'Last Result',
      value: '3.85',
      icon: 'school',
      color: '#16A34A',
      bgColor: isDark ? 'rgba(22, 163, 74, 0.1)' : 'rgba(22, 163, 74, 0.08)',
    },
    {
      id: 3,
      title: 'Due Fees',
      value: `৳ ${feeStats.totalDue.toLocaleString()}`,
      icon: 'cash',
      color: '#F59E0B',
      bgColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
    },
    {
      id: 4,
      title: 'Class Routine',
      value: 'View',
      icon: 'book',
      color: '#2563EB',
      bgColor: isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.08)',
    },
  ];

  const quickActions = [
    { id: 1, title: 'Timetable', icon: 'time', color: isDark ? '#EF4444' : '#DC2626', route: '/upcooming' },
    { id: 2, title: 'Results', icon: 'clipboard', color: '#16A34A', route: '/upcooming' },
    { id: 3, title: 'Pay Fees', icon: 'card', color: '#2563EB', route: '/fees' },
    { id: 4, title: 'Subjects', icon: 'book-outline', color: '#F59E0B', route: '/subjects' },
  ];

  return (
    <CommonLayout 
      title="Dashboard" 
      currentRoute="dashboard"
      onRefresh={handleRefresh}
    >
      <ScrollView 
        className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
        showsVerticalScrollIndicator={false}
      >
        {/* Student Profile Header */}
        <View className={`mx-4 mt-4 rounded-2xl border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } p-4`}>
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center flex-1 gap-3">
              {studentData?.student_image_url ? (
                <Image 
                  source={{ uri: studentData.student_image_url }}
                  className="w-14 h-14 rounded-xl"
                />
              ) : (
                <View className={`${
                  isDark ? 'bg-primary-500' : 'bg-primary-600'
                } rounded-xl w-14 h-14 items-center justify-center`}>
                  <Ionicons name="person" size={28} color="white" />
                </View>
              )}
              
              <View className="flex-1">
                <Text className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`} numberOfLines={1}>
                  {studentData?.student_name || userData?.name || 'Student Name'}
                </Text>
                <Text className={`text-sm font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`} numberOfLines={1}>
                  {studentData?.class_wise_data?.[0]?.class?.class_name 
                    ? `${studentData.class_wise_data[0].class.class_name} - ${studentData.class_wise_data[0].section?.section_name || ''}`
                    : 'Class & Section'}
                </Text>
              </View>
            </View>
            
            <View className={`${
              isDark ? 'bg-primary-500' : 'bg-primary-600'
            } rounded-xl px-3 py-2 min-w-[70px] items-center`}>
              <Text className="text-white text-xs font-semibold">ROLL</Text>
              <Text className="text-white text-xl font-bold">
                {studentData?.class_wise_data?.[0]?.class_roll || '---'}
              </Text>
            </View>
          </View>
          
          <View className="items-center">
            <Text className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              ID: <Text className={`${
                isDark ? 'text-primary-400' : 'text-primary-600'
              } font-semibold`}>
                {studentData?.id_card_number || 'N/A'}
              </Text>
            </Text>
          </View>
        </View>

        {/* Important Notice */}
        <View
          className="mx-4 mt-6 rounded-2xl border p-4"
          style={{
            backgroundColor: isDark 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(220, 38, 38, 0.08)',
            borderColor: isDark 
              ? 'rgba(239, 68, 68, 0.2)' 
              : 'rgba(220, 38, 38, 0.15)',
          }}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <Ionicons 
              name="notifications" 
              size={20} 
              color={isDark ? '#EF4444' : '#DC2626'} 
            />
            <Text className={`text-lg font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Important Notice
            </Text>
          </View>
          <Text className={`text-sm font-medium leading-5 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Mid-term exams start next week. Check timetable for schedule.
          </Text>
        </View>

        {/* Dashboard Stats */}
        <Text className={`text-xl font-bold mx-4 mt-6 mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          My Overview
        </Text>
        
        <View className="flex-row flex-wrap justify-between px-4">
          {dashboardCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              onPress={() => handleCardClick(card.id)}
              activeOpacity={0.7}
              className={`w-[48%] rounded-2xl border mb-3 p-4 items-center ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}
              style={{ minHeight: 140 }}
            >
              <View
                className="rounded-xl w-12 h-12 items-center justify-center mb-3"
                style={{ backgroundColor: card.bgColor }}
              >
                <Ionicons name={card.icon as any} size={24} color={card.color} />
              </View>
              <Text className={`text-xl font-bold mb-1 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {card.value}
              </Text>
              <Text className={`text-sm font-medium text-center ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`} numberOfLines={2}>
                {card.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Schedule */}
        <View className="flex-row justify-between items-center mx-4 mt-6 mb-4">
          <Text className={`text-xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Today&apos;s Classes
          </Text>
          <TouchableOpacity onPress={() => router.push('/classroutine' as Href)}>
            <Text className={`text-sm font-semibold ${
              isDark ? 'text-primary-400' : 'text-primary-600'
            }`}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        
        <View className={`mx-4 rounded-2xl border overflow-hidden ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {todaysClasses.map((cls, index) => (
            <View
              key={cls.id}
              className={`p-4 ${
                index < todaysClasses.length - 1 
                  ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}` 
                  : ''
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className={`w-2 h-2 rounded-full ${
                    isDark ? 'bg-primary-500' : 'bg-primary-600'
                  }`} />
                  <View className="flex-1">
                    <Text className={`text-base font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`} numberOfLines={1}>
                      {cls.subject}
                    </Text>
                    {cls.teacher && (
                      <Text className={`text-xs mt-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`} numberOfLines={1}>
                        {cls.teacher}
                      </Text>
                    )}
                  </View>
                </View>
                {cls.time && (
                  <View className="items-end ml-2">
                    <Text className={`text-sm font-semibold mb-1 ${
                      isDark ? 'text-primary-400' : 'text-primary-600'
                    }`}>
                      {cls.time}
                    </Text>
                    <Text className={`text-xs font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {cls.room}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text className={`text-xl font-bold mx-4 mt-6 mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Quick Access
        </Text>
        
        <View className="flex-row flex-wrap justify-between px-4">
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              className={`w-[48%] rounded-2xl border mb-3 p-4 items-center ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}
              style={{ minHeight: 120 }}
              activeOpacity={0.7}
              onPress={() => router.push(action.route as Href)}
            >
              <View
                className="rounded-xl w-14 h-14 items-center justify-center mb-3"
                style={{ 
                  backgroundColor: isDark 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : 'rgba(220, 38, 38, 0.08)' 
                }}
              >
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text className={`text-sm font-semibold text-center ${
                isDark ? 'text-white' : 'text-gray-900'
              }`} numberOfLines={2}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image Slider - Dynamic from API */}
        <Text className={`text-xl font-bold mx-4 mt-6 mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Announcements
        </Text>

        {loadingSliders ? (
          <View className="mx-4 h-48 rounded-2xl bg-gray-200 items-center justify-center">
            <ActivityIndicator size="large" color="#DC2626" />
          </View>
        ) : sliderImages.length > 0 ? (
          <View className="mx-4">
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const slideIndex = Math.round(
                  event.nativeEvent.contentOffset.x / (width - 32)
                );
                setCurrentSlide(slideIndex);
              }}
              scrollEventThrottle={16}
            >
              {sliderImages.map((slider) => {
                const imageUrl = getSliderImageUrl(slider.image);
                
                return (
                  <View
                    key={slider.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ width: width - 32, marginRight: 0 }}
                  >
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-48"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className={`w-full h-48 items-center justify-center ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <Ionicons name="image-outline" size={48} color={isDark ? '#4B5563' : '#9CA3AF'} />
                        <Text className={`mt-2 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>No Image</Text>
                      </View>
                    )}
                    <View className={`absolute bottom-0 left-0 right-0 p-4 ${
                      isDark ? 'bg-gray-900/80' : 'bg-white/80'
                    }`}>
                      <Text className={`text-lg font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {slider.title}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View className="flex-row justify-center items-center mt-3 gap-2">
              {sliderImages.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 rounded-full ${
                    currentSlide === index
                      ? `w-6 ${isDark ? 'bg-primary-500' : 'bg-primary-600'}`
                      : `w-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`
                  }`}
                />
              ))}
            </View>
          </View>
        ) : (
          <View className={`mx-4 rounded-2xl p-8 items-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Ionicons 
              name="images-outline" 
              size={48} 
              color={isDark ? '#6B7280' : '#9CA3AF'} 
            />
            <Text className={`mt-3 text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No announcements available
            </Text>
          </View>
        )}
      </ScrollView>
    </CommonLayout>
  );
}