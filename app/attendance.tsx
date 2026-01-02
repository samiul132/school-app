import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import CommonLayout from '../components/CommonLayout';
import {
  getStudentProfileByIdApi,
  getUserData,
  apiRequest,
} from '../config/api';
import '../global.css';

export default function AttendanceScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [classRoutine, setClassRoutine] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    percentage: 0,
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
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
              await fetchAttendanceRecords(classWiseStudentId);
            }
            
            if (classId && sectionId) {
              await fetchClassRoutine(classId, sectionId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string | null): string => {
	  if (!time) return 'N/A';
	  
	  try {
	    const [hours, minutes] = time.split(':');
	    const hour = parseInt(hours);
	    const ampm = hour >= 12 ? 'PM' : 'AM';
	    const hour12 = hour % 12 || 12;
	    return `${hour12}:${minutes} ${ampm}`;
	  } catch {
	    return time;
	  }
	};

  const fetchClassRoutine = async (classId: number, sectionId: number) => {
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
        
        setClassRoutine(studentRoutine);
      }
    } catch (error) {
      console.error('Error fetching class routine:', error);
    }
  };

  const fetchAttendanceRecords = async (classWiseStudentId: number) => {
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
        const records = data.data.data;
        setAttendanceRecords(records);
        
        const totalDays = records.length;
        const presentDays = records.filter((r: any) => r.status === 'Present').length;
        const absentDays = records.filter((r: any) => r.status === 'Absent').length;
        const lateDays = records.filter((r: any) => r.status === 'Late').length;
        const leaveDays = records.filter((r: any) => r.status === 'Leave').length;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        
        setAttendanceStats({
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          leaveDays,
          percentage,
        });
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const handleRefresh = async () => {
    await loadAttendanceData();
  };

  const isOffDay = (date: Date): boolean => {
    if (!classRoutine || !classRoutine.off_day) return false;
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const offDays = classRoutine.off_day.split(',').map((d: string) => d.trim());
    
    return offDays.includes(dayName);
  };

  const getAttendanceForDate = (date: Date): string | null => {
    const dateStr = date.toISOString().split('T')[0];
    const record = attendanceRecords.find((r: any) => r.date === dateStr);
    return record ? record.status : null;
  };

  const getDateStatus = (date: Date): 'present' | 'absent' | 'late' | 'leave' | 'off' | 'future' | null => {
	  const today = new Date();
	  today.setHours(0, 0, 0, 0);
	  const checkDate = new Date(date);
	  checkDate.setHours(0, 0, 0, 0);
	  
	  if (checkDate > today) return 'future';
	  
	  if (studentData?.created_at) {
	    const admissionDate = new Date(studentData.created_at);
	    admissionDate.setHours(0, 0, 0, 0);
	    if (checkDate < admissionDate) return null; 
	  }
	  
	  if (isOffDay(date)) return 'off';
	  
	  const status = getAttendanceForDate(date);
	  if (status === 'Present') return 'present';
	  if (status === 'Late') return 'late';
	  if (status === 'Leave') return 'leave';
	  
	  return 'absent';
	};

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present':
        return { bg: isDark ? 'bg-green-900/30' : 'bg-green-100', text: 'text-green-600', border: 'border-green-500' };
      case 'absent':
        return { bg: isDark ? 'bg-red-900/30' : 'bg-red-100', text: 'text-red-600', border: 'border-red-500' };
      case 'late':
        return { bg: isDark ? 'bg-amber-900/30' : 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-500' };
      case 'leave':
        return { bg: isDark ? 'bg-blue-900/30' : 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' };
      case 'off':
        return { bg: isDark ? 'bg-gray-700' : 'bg-gray-200', text: 'text-gray-500', border: 'border-gray-400' };
      case 'future':
        return { bg: '', text: isDark ? 'text-gray-600' : 'text-gray-400', border: '' };
      default:
        return { bg: '', text: isDark ? 'text-gray-300' : 'text-gray-700', border: '' };
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Present':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10B981',
          bgColor: isDark ? 'bg-green-900/30' : 'bg-green-100',
          textColor: 'text-green-600',
        };
      case 'Absent':
        return {
          icon: 'close-circle' as const,
          color: '#EF4444',
          bgColor: isDark ? 'bg-red-900/30' : 'bg-red-100',
          textColor: 'text-red-600',
        };
      case 'Late':
        return {
          icon: 'time' as const,
          color: '#F59E0B',
          bgColor: isDark ? 'bg-amber-900/30' : 'bg-amber-100',
          textColor: 'text-amber-600',
        };
      case 'Leave':
        return {
          icon: 'calendar' as const,
          color: '#3B82F6',
          bgColor: isDark ? 'bg-blue-900/30' : 'bg-blue-100',
          textColor: 'text-blue-600',
        };
      default:
        return {
          icon: 'help-circle' as const,
          color: '#6B7280',
          bgColor: isDark ? 'bg-gray-700' : 'bg-gray-100',
          textColor: 'text-gray-600',
        };
    }
  };

  if (loading) {
    return (
      <CommonLayout title="Attendance" currentRoute="attendance" onRefresh={handleRefresh}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading attendance data...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <CommonLayout title="Attendance" currentRoute="attendance" onRefresh={handleRefresh}>
      <ScrollView 
        className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
        showsVerticalScrollIndicator={false}
      >
        {/* Attendance Overview Cards */}
        <View className="px-4 mt-4">
          {/* Percentage Card - Full Width */}
          <View 
            className="rounded-2xl p-5 mb-3"
            style={{ 
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF',
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-20 h-20 rounded-full items-center justify-center mr-4"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#E0E7FF',
                  }}
                >
                  <Text className="text-3xl font-bold text-indigo-600">
                    {attendanceStats.percentage}%
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Overall Attendance
                  </Text>
                  <Text className={`text-2xl font-bold mt-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {attendanceStats.presentDays}/{attendanceStats.totalDays} Days
                  </Text>
                </View>
              </View>
              <View className={`px-4 py-2 rounded-full ${
                attendanceStats.percentage >= 75 
                  ? (isDark ? 'bg-green-900/30' : 'bg-green-100')
                  : (isDark ? 'bg-red-900/30' : 'bg-red-100')
              }`}>
                <Text className={`text-sm font-semibold ${
                  attendanceStats.percentage >= 75 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {attendanceStats.percentage >= 75 ? 'Good' : 'Low'}
                </Text>
              </View>
            </View>
          </View>

          {/* Status Cards - 2x2 Grid */}
          <View className="flex-row flex-wrap justify-between mb-4">
            <View 
              className="w-[48%] rounded-2xl p-4 mb-3"
              style={{ 
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <View className={`px-2 py-1 rounded-full ${
                  isDark ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <Text className="text-xs font-semibold text-green-600">
                    Present
                  </Text>
                </View>
              </View>
              <Text className={`text-2xl font-bold mt-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {attendanceStats.presentDays}
              </Text>
              <Text className={`text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Days Present
              </Text>
            </View>

            <View 
              className="w-[48%] rounded-2xl p-4 mb-3"
              style={{ 
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="close-circle" size={24} color="#EF4444" />
                <View className={`px-2 py-1 rounded-full ${
                  isDark ? 'bg-red-900/30' : 'bg-red-100'
                }`}>
                  <Text className="text-xs font-semibold text-red-600">
                    Absent
                  </Text>
                </View>
              </View>
              <Text className={`text-2xl font-bold mt-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {attendanceStats.absentDays}
              </Text>
              <Text className={`text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Days Absent
              </Text>
            </View>

            <View 
              className="w-[48%] rounded-2xl p-4"
              style={{ 
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="time" size={24} color="#F59E0B" />
                <View className={`px-2 py-1 rounded-full ${
                  isDark ? 'bg-amber-900/30' : 'bg-amber-100'
                }`}>
                  <Text className="text-xs font-semibold text-amber-600">
                    Late
                  </Text>
                </View>
              </View>
              <Text className={`text-2xl font-bold mt-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {attendanceStats.lateDays}
              </Text>
              <Text className={`text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Days Late
              </Text>
            </View>

            <View 
              className="w-[48%] rounded-2xl p-4"
              style={{ 
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="calendar" size={24} color="#3B82F6" />
                <View className={`px-2 py-1 rounded-full ${
                  isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <Text className="text-xs font-semibold text-blue-600">
                    Leave
                  </Text>
                </View>
              </View>
              <Text className={`text-2xl font-bold mt-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {attendanceStats.leaveDays}
              </Text>
              <Text className={`text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Days Leave
              </Text>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View className={`mx-4 mb-4 rounded-2xl border overflow-hidden ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {/* Calendar Header */}
          <View className={`flex-row items-center justify-between p-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <TouchableOpacity onPress={() => changeMonth('prev')} className="p-2">
              <Ionicons name="chevron-back" size={24} color={isDark ? '#F9FAFB' : '#374151'} />
            </TouchableOpacity>
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {monthName}
            </Text>
            <TouchableOpacity onPress={() => changeMonth('next')} className="p-2">
              <Ionicons name="chevron-forward" size={24} color={isDark ? '#F9FAFB' : '#374151'} />
            </TouchableOpacity>
          </View>

          {/* Day Names */}
          <View className="flex-row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} className="flex-1 py-2">
                <Text className={`text-center text-xs font-semibold ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="p-2">
            <View className="flex-row flex-wrap">
              {daysInMonth.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} className="w-[14.28%] aspect-square p-1" />;
                }
                
                const status = getDateStatus(date);
                const colors = getStatusColor(status);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <TouchableOpacity
                    key={index}
                    className="w-[14.28%] aspect-square p-1"
                    onPress={() => setSelectedDate(date)}
                    activeOpacity={0.7}
                  >
                    <View className={`flex-1 rounded-lg items-center justify-center ${colors.bg} ${
                      isToday ? `border-2 ${colors.border || 'border-indigo-500'}` : ''
                    }`}>
                      <Text className={`text-sm font-semibold ${colors.text}`}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Legend */}
          <View className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Text className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Legend:
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-row items-center">
                <View className={`w-4 h-4 rounded ${isDark ? 'bg-green-900/30' : 'bg-green-100'} mr-1`} />
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Present</Text>
              </View>
              <View className="flex-row items-center">
                <View className={`w-4 h-4 rounded ${isDark ? 'bg-red-900/30' : 'bg-red-100'} mr-1`} />
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Absent</Text>
              </View>
              <View className="flex-row items-center">
                <View className={`w-4 h-4 rounded ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'} mr-1`} />
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Late</Text>
              </View>
              <View className="flex-row items-center">
                <View className={`w-4 h-4 rounded ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'} mr-1`} />
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Leave</Text>
              </View>
              <View className="flex-row items-center">
                <View className={`w-4 h-4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} mr-1`} />
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Off Day</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Attendance Records */}
        {attendanceRecords.length > 0 ? (
          <View className={`mx-4 mb-6 rounded-2xl border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <View className={`flex-row items-center justify-between p-5 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <View className="flex-row items-center">
                <Ionicons name="list-outline" size={24} color="#6366F1" />
                <Text className={`text-lg font-bold ml-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Attendance History
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'
              }`}>
                <Text className="text-xs font-semibold text-indigo-600">
                  {attendanceRecords.length} Records
                </Text>
              </View>
            </View>

            <View className="p-5">
              {attendanceRecords.slice(0, 5).map((record, index) => {
                const statusConfig = getStatusConfig(record.status);
                return (
                  <View key={record.id}>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center flex-1">
                        <View className={`w-12 h-12 rounded-full items-center justify-center ${statusConfig.bgColor}`}>
                          <Ionicons
                            name={statusConfig.icon}
                            size={24}
                            color={statusConfig.color}
                          />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className={`text-base font-semibold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {formatDate(record.date)}
                          </Text>
                          <Text className={`text-xs mt-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {getDayName(record.date)} • In: {formatTime(record.in_time)} • Out: {formatTime(record.out_time)}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <View className={`px-3 py-1 rounded-full ${statusConfig.bgColor}`}>
                          <Text className={`text-xs font-semibold ${statusConfig.textColor}`}>
                            {record.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {index < Math.min(4, attendanceRecords.length - 1) && (
                      <View className={`h-px my-4 ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className={`mx-4 mb-6 rounded-2xl p-6 text-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Ionicons 
              name="calendar-outline" 
              size={48} 
              color={isDark ? '#6B7280' : '#9CA3AF'} 
              style={{ alignSelf: 'center', marginBottom: 12 }}
            />
            <Text className={`text-base font-semibold text-center ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No attendance records found
            </Text>
          </View>
        )}

        {/* Info Section */}
        <View className={`mx-4 mb-6 rounded-2xl p-5 border ${
          isDark 
            ? 'bg-blue-900/20 border-blue-800' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
            <Text className={`text-base font-bold ml-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Attendance Policy
            </Text>
          </View>
          <Text className={`text-sm leading-5 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Students must maintain at least 75% attendance to be eligible for examinations. 
            Gray dates are off days. Days without records (except off days) are marked as absent.
          </Text>
        </View>
      </ScrollView>
    </CommonLayout>
  );
}