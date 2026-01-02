import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import CommonLayout from '../components/CommonLayout';
import { getTeachersApi, getDesignationsApi, API_BASE_URL } from '../config/api';

interface Teacher {
  id: number;
  first_name: string;
  last_name: string | null;
  designation: number;
  designation_name?: string;
  phone: string | null;
  email: string | null;
  photo: string | null;
  qualification: string | null;
  joining_date: string | null;
  is_teachers: number;
}

interface Designation {
  id: number;
  name: string;
}

export default function OurTeachersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch both teachers and designations in parallel
      const [teachersResponse, designationsResponse] = await Promise.all([
        getTeachersApi(),
        getDesignationsApi(),
      ]);

      if (designationsResponse.success) {
        setDesignations(designationsResponse.data || []);
      }

      if (teachersResponse.success) {
        // Filter only teachers (is_teachers = 1) and map designation names
        const teachersData = (teachersResponse.data || [])
          .filter((staff: Teacher) => staff.is_teachers === 1)
          .map((teacher: Teacher) => ({
            ...teacher,
            designation_name: designationsResponse.data?.find(
              (d: Designation) => d.id === teacher.designation
            )?.name || 'Teacher',
          }));
        
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      Alert.alert('Error', 'Failed to load teachers data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.first_name} ${teacher.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.designation_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCall = (phone: string | null) => {
    if (!phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string | null) => {
    if (!email) {
      Alert.alert('Error', 'Email not available');
      return;
    }
    Linking.openURL(`mailto:${email}`);
  };

  const getPhotoUrl = (photo: string | null): string | undefined => {
    if (!photo) return undefined;
    
    console.log('Original photo:', photo); // Debug log
    
    // Check if it's already a full URL
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    
    // Get base URL without /api
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    // If it's just a filename (like staff_1767002711_YUyvGxUZ3V.png)
    // Add the staffs images path
    if (!photo.includes('/') && !photo.includes('\\')) {
      const finalUrl = `${baseUrl}/assets/images/staffs/${photo}`;
      console.log('Staff photo URL:', finalUrl);
      return finalUrl;
    }
    
    // Handle paths with slashes
    let cleanPath = photo.replace(/\\/g, '/');
    if (cleanPath.startsWith('public/')) {
      cleanPath = cleanPath.replace('public/', '');
    }
    
    const finalUrl = `${baseUrl}/${cleanPath}`;
    console.log('Final URL:', finalUrl);
    
    return finalUrl;
  };

  const TeacherCard = ({ teacher }: { teacher: Teacher }) => {
    const fullName = `${teacher.first_name} ${teacher.last_name || ''}`.trim();
    const photoUrl = getPhotoUrl(teacher.photo);

    return (
      <View
        className={`rounded-2xl p-5 mb-4 shadow-sm ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <View className="flex-row">
          {/* Teacher Image */}
          <View className="w-24 h-24 rounded-xl bg-primary-100 items-center justify-center overflow-hidden mr-4">
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={48} color="#DC2626" />
            )}
          </View>

          {/* Teacher Info */}
          <View className="flex-1">
            <Text
              className={`text-lg font-bold mb-1 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
              numberOfLines={2}
            >
              {fullName}
            </Text>
            <Text className="text-primary-600 font-semibold mb-2">
              {teacher.designation_name}
            </Text>
            {teacher.qualification && (
              <View className="flex-row items-center">
                <Ionicons
                  name="school-outline"
                  size={14}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className={`text-sm ml-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  numberOfLines={1}
                >
                  {teacher.qualification}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Details */}
        {(teacher.phone || teacher.email) && (
          <View className={`mt-4 pt-4 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {teacher.phone && (
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className={`text-sm ml-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {teacher.phone}
                </Text>
              </View>
            )}
            {teacher.email && (
              <View className="flex-row items-center">
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className={`text-sm ml-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  numberOfLines={1}
                >
                  {teacher.email}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Contact Buttons */}
        <View className="flex-row gap-2 mt-4">
          {teacher.phone && (
            <TouchableOpacity
              className="flex-1 bg-primary-600 rounded-xl py-3 items-center"
              activeOpacity={0.8}
              onPress={() => handleCall(teacher.phone)}
            >
              <View className="flex-row items-center">
                <Ionicons name="call-outline" size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Call</Text>
              </View>
            </TouchableOpacity>
          )}
          {teacher.email && (
            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
              activeOpacity={0.8}
              onPress={() => handleEmail(teacher.email)}
            >
              <View className="flex-row items-center">
                <Ionicons name="mail-outline" size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Email</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <CommonLayout title="Our Teachers" currentRoute="teachers">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DC2626" />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading teachers...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="Our Teachers" currentRoute="teachers">
      <View className="flex-1 px-4 pt-4">
        {/* Header Stats */}
        <View className="flex-row mb-4 gap-3">
          <View
            className={`flex-1 rounded-xl p-4 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <Ionicons name="people" size={24} color="#DC2626" />
            <Text
              className={`text-2xl font-bold mt-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {teachers.length}
            </Text>
            <Text
              className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Total Teachers
            </Text>
          </View>
          <View
            className={`flex-1 rounded-xl p-4 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <Ionicons name="ribbon" size={24} color="#3B82F6" />
            <Text
              className={`text-2xl font-bold mt-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {designations.length}
            </Text>
            <Text
              className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Designations
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          className={`flex-row items-center rounded-xl px-4 py-3 mb-6 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
          <TextInput
            placeholder="Search teachers by name, designation, email..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`flex-1 ml-3 text-base ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Teachers List */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#DC2626"
            />
          }
        >
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons
                name="search-outline"
                size={64}
                color={isDark ? '#4B5563' : '#D1D5DB'}
              />
              <Text
                className={`text-lg font-semibold mt-4 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {searchQuery ? 'No teachers found' : 'No teachers available'}
              </Text>
              <Text
                className={`text-sm mt-2 text-center px-8 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {searchQuery ? 'Try adjusting your search' : 'Teachers data will appear here'}
              </Text>
            </View>
          )}
          <View className="h-6" />
        </ScrollView>
      </View>
    </CommonLayout>
  );
}