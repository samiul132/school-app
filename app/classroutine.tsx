import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CommonLayout from '../components/CommonLayout';
import { apiRequest, getSchoolSettingsApi } from '../config/api';

interface ClassRoutine {
  id: number;
  session_id: number;
  version_id: number;
  shift_id: number;
  class_id: number;
  section_id: number;
  number_of_periods: number;
  off_day: string;
  session?: { session_name: string };
  version?: { version_name: string };
  shift?: { shift_name: string };
  class?: { class_name: string };
  section?: { section_name: string };
  details?: RoutineDetail[];
}

interface RoutineDetail {
  id: number;
  class_routine_id: number;
  subject_id: number;
  teacher_id: number;
  period_number: string | number;
  day_name: string;
  time: string;
  subject?: { 
    id: number;
    subject_name: string;
  };
  teacher?: { 
    id: number;
    first_name: string; 
    last_name: string | null;
  };
}

interface SchoolSettings {
  school_name: string;
  address: string;
  mobile_number: string;
  email: string;
  logo_url?: string;
}

export default function ClassRoutineScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState<ClassRoutine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<ClassRoutine | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routinesResponse, schoolResponse] = await Promise.all([
        apiRequest('/class-routines', 'GET'),
        getSchoolSettingsApi(),
      ]);

      if (routinesResponse.success) {
        let routinesData = [];
        
        // Check if data is paginated object or direct object/array
        if (routinesResponse.data?.data) {
          // Paginated response: { data: { data: [...] } }
          routinesData = Array.isArray(routinesResponse.data.data) 
            ? routinesResponse.data.data 
            : [routinesResponse.data.data];
        } else if (routinesResponse.data) {
          // Direct response: { data: {...} } or { data: [...] }
          routinesData = Array.isArray(routinesResponse.data) 
            ? routinesResponse.data 
            : [routinesResponse.data];
        }
        
        setRoutines(routinesData);
        if (routinesData.length > 0) {
          setSelectedRoutine(routinesData[0]);
        }
      }

      if (schoolResponse.success) {
        setSchoolSettings(schoolResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load class routine');
    } finally {
      setLoading(false);
    }
  };

  const getActiveDays = (routine: ClassRoutine): string[] => {
    if (!routine.off_day) return days;
    const offDays = routine.off_day.split(',').map(d => d.trim());
    return days.filter(day => !offDays.includes(day));
  };

  const getRoutineDetail = (routine: ClassRoutine, day: string, period: number): RoutineDetail | undefined => {
    if (!routine.details) return undefined;
    return routine.details.find(
      detail => detail.day_name === day && parseInt(String(detail.period_number)) === period
    );
  };

  const getPeriodTime = (routine: ClassRoutine, period: number): string => {
    const detail = routine.details?.find(d => parseInt(String(d.period_number)) === period);
    return detail?.time || '-';
  };

  const getOrdinal = (num: number): string => {
    const ordinals: { [key: number]: string } = {
      1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th',
      6: '6th', 7: '7th', 8: '8th', 9: '9th', 10: '10th'
    };
    return ordinals[num] || `${num}th`;
  };

  if (loading) {
    return (
      <CommonLayout title="Class Routine" currentRoute="classroutine">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DC2626" />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading routine...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  if (!selectedRoutine) {
    return (
      <CommonLayout title="Class Routine" currentRoute="classroutine">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="calendar-outline" size={64} color={isDark ? '#4B5563' : '#D1D5DB'} />
          <Text className={`text-lg font-semibold mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No routine available
          </Text>
        </View>
      </CommonLayout>
    );
  }

  const activeDays = getActiveDays(selectedRoutine);
  const totalPeriods = parseInt(String(selectedRoutine.number_of_periods));

  return (
    <CommonLayout title="Class Routine" currentRoute="classroutine" onRefresh={loadData}>
      <View className="flex-1 px-4 pt-4">
        {/* Class Info */}
        <View className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <Text className={`text-center text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {selectedRoutine.version?.version_name}, {selectedRoutine.class?.class_name}, {selectedRoutine.section?.section_name}
          </Text>
        </View>

        {/* Routine Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="flex-row border-b" style={{ borderColor: '#666' }}>
              <View className="w-36 p-3 border-r justify-center items-center" style={{ borderColor: '#666' }}>
                <Text className={`font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Day</Text>
              </View>
              {Array.from({ length: totalPeriods }, (_, i) => i + 1).map(period => (
                <View key={`header-${period}`} className="w-32">
                  <View className="p-2 border-b border-r" style={{ borderColor: '#666' }}>
                    <Text className={`font-bold text-center text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getOrdinal(period)} Period
                    </Text>
                  </View>
                  <View className="p-1 border-r" style={{ borderColor: '#666' }}>
                    <Text className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getPeriodTime(selectedRoutine, period)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {activeDays.map((day, dayIndex) => (
              <View 
                key={day} 
                className={`flex-row ${dayIndex < activeDays.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: '#666' }}
              >
                <View className="w-36 p-3 border-r justify-center items-center" style={{ borderColor: '#666' }}>
                  <Text className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{day}</Text>
                </View>
                {Array.from({ length: totalPeriods }, (_, i) => i + 1).map(period => {
                  const detail = getRoutineDetail(selectedRoutine, day, period);
                  return (
                    <View key={`${day}-${period}`} className="w-32 p-2 border-r" style={{ borderColor: '#666' }}>
                      {detail ? (
                        <View>
                          <Text className={`text-sm font-semibold text-center ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={2}>
                            {detail.subject?.subject_name || 'N/A'}
                          </Text>
                          <Text className={`text-xs text-center mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={1}>
                            {detail.teacher?.first_name} {detail.teacher?.last_name || ''}
                          </Text>
                        </View>
                      ) : (
                        <Text className={`text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>-</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </CommonLayout>
  );
}