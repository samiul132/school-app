import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import Toast from 'react-native-toast-message';
import CommonLayout from '../components/CommonLayout';
import {
  changePasswordApi,
  customLogoutApi,
  getCurrentUserApi,
  getStudentProfileByIdApi,
  getUserData
} from '../config/api';
import '../global.css';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  
  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // First get user data
      const localUser = await getUserData();
      if (localUser) {
        setUserData(localUser);
      }

      // Fetch fresh user data from API
      const response = await getCurrentUserApi();
      if (response.success && response.data) {
        setUserData(response.data);
        
        // If user is a student, fetch their profile data
        if (response.data.type === 'STUDENT' && response.data.student_id) {
          try {
            const studentResponse = await getStudentProfileByIdApi(response.data.student_id);
            if (studentResponse.success) {
              setStudentData(studentResponse.data);
            }
          } catch (error) {
            console.error('Error loading student profile:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile data',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadUserProfile();
  };

  // Build profile info based on user type
  const getProfileInfo = () => {
    if (userData?.type === 'STUDENT' && studentData) {
      // Get class wise data (active session data)
      const classWiseData = studentData.class_wise_data?.[0];
      
      return [
        { label: 'Name', value: studentData.student_name || 'N/A', icon: 'person-outline' },
        { label: 'ID Card', value: studentData.id_card_number || 'N/A', icon: 'card-outline' },
        { label: 'Class Roll', value: classWiseData?.class_roll?.toString() || 'N/A', icon: 'list-outline' },
        { label: 'Email', value: studentData.email || userData.email || 'N/A', icon: 'mail-outline' },
        { label: 'Mobile', value: studentData.mobile_number || 'N/A', icon: 'call-outline' },
        { label: 'Date of Birth', value: studentData.date_of_birth || 'N/A', icon: 'calendar-outline' },
        { label: 'Gender', value: studentData.gender || 'N/A', icon: 'male-female-outline' },
        { label: 'Blood Group', value: studentData.blood_group || 'N/A', icon: 'water-outline' },
        { label: 'Religion', value: studentData.religion || 'N/A', icon: 'book-outline' },
      ];
    } else {
      return [
        { label: 'Name', value: userData?.name || 'N/A', icon: 'person-outline' },
        { label: 'Email', value: userData?.email || 'N/A', icon: 'mail-outline' },
        { label: 'Username', value: userData?.user_name || 'N/A', icon: 'at-outline' },
      ];
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Toast.show({
        type: 'info',
        text1: 'Required Field',
        text2: 'Current password is required',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    if (!newPassword) {
      Toast.show({
        type: 'info',
        text1: 'Required Field',
        text2: 'New password is required',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    if (newPassword.length < 8) {
      Toast.show({
        type: 'info',
        text1: 'Invalid Password',
        text2: 'Password must be at least 8 characters',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'Passwords do not match!',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await changePasswordApi(
        currentPassword,
        newPassword,
        confirmPassword
      );

      if (response.success) {
        setPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: 'Password changed successfully',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to change password',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
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
              setLoading(true);
              await customLogoutApi();
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
              router.replace('/login' as Href);
              
              Toast.show({
                type: 'info',
                text1: 'Session Ended',
                text2: 'You have been logged out',
                position: 'top',
                visibilityTime: 2000,
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !userData) {
    return (
      <CommonLayout title="Profile" currentRoute="profile" onRefresh={handleRefresh}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DC2626" />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading profile...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  const profileInfo = getProfileInfo();
  const displayName = userData?.type === 'STUDENT' && studentData 
    ? studentData.student_name 
    : userData?.name;
  const displayEmail = userData?.type === 'STUDENT' && studentData 
    ? studentData.email || userData?.email
    : userData?.email;
  const studentImage = studentData?.student_image_url;

  return (
    <CommonLayout title="Profile" currentRoute="profile" onRefresh={handleRefresh}>
      <ScrollView 
        className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className={`px-4 py-8 items-center ${
          isDark ? 'bg-primary-600' : 'bg-primary-600'
        }`}>
          {/* Profile Image or Initial */}
          {studentImage ? (
            <Image 
              source={{ uri: studentImage }}
              className="w-24 h-24 rounded-full mb-4 border-4 border-white shadow-lg"
            />
          ) : (
            <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 shadow-lg">
              <Text className="text-primary-600 text-5xl font-bold">
                {displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          
          <Text className="text-white text-2xl font-bold">
            {displayName || 'User'}
          </Text>
          <Text className="text-white/90 text-sm mt-1">
            {displayEmail || 'N/A'}
          </Text>

          {/* ID Card Number for Students */}
          {userData?.type === 'STUDENT' && studentData?.id_card_number && (
            <View className="bg-white/20 px-4 py-2 rounded-full mt-3">
              <Text className="text-white font-semibold">
                ID: {studentData.id_card_number}
              </Text>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View className="px-4 py-6">
          <Text className={`text-lg font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            Personal Information
          </Text>
          <View className={`rounded-2xl shadow-sm overflow-hidden border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {profileInfo.map((info, index) => (
              <View
                key={index}
                className={`flex-row items-center p-4 ${
                  index !== profileInfo.length - 1 
                    ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}` 
                    : ''
                }`}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  isDark ? 'bg-primary-500/20' : 'bg-primary-50'
                }`}>
                  <Ionicons name={info.icon as any} size={20} color="#DC2626" />
                </View>
                <View className="flex-1">
                  <Text className={`text-xs mb-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {info.label}
                  </Text>
                  <Text className={`font-medium ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    {info.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Academic Information (Only for Students) */}
        {userData?.type === 'STUDENT' && studentData?.class_wise_data?.[0] && (
          <View className="px-4 mb-6">
            <Text className={`text-lg font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              Academic Information
            </Text>
            <View className={`rounded-2xl shadow-sm overflow-hidden border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Session */}
              {studentData.class_wise_data[0].session?.session_name && (
                <View className={`flex-row items-center p-4 border-b ${
                  isDark ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                  }`}>
                    <Ionicons name="time-outline" size={20} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Session
                    </Text>
                    <Text className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {studentData.class_wise_data[0].session.session_name}
                    </Text>
                  </View>
                </View>
              )}

              {/* Class */}
              {studentData.class_wise_data[0].class?.class_name && (
                <View className={`flex-row items-center p-4 border-b ${
                  isDark ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isDark ? 'bg-green-500/20' : 'bg-green-50'
                  }`}>
                    <Ionicons name="school-outline" size={20} color="#22C55E" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Class
                    </Text>
                    <Text className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {studentData.class_wise_data[0].class.class_name}
                    </Text>
                  </View>
                </View>
              )}

              {/* Section */}
              {studentData.class_wise_data[0].section?.section_name && (
                <View className={`flex-row items-center p-4 border-b ${
                  isDark ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isDark ? 'bg-purple-500/20' : 'bg-purple-50'
                  }`}>
                    <Ionicons name="grid-outline" size={20} color="#A855F7" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Section
                    </Text>
                    <Text className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {studentData.class_wise_data[0].section.section_name}
                    </Text>
                  </View>
                </View>
              )}

              {/* Version */}
              {studentData.class_wise_data[0].version?.version_name && (
                <View className={`flex-row items-center p-4 border-b ${
                  isDark ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isDark ? 'bg-orange-500/20' : 'bg-orange-50'
                  }`}>
                    <Ionicons name="albums-outline" size={20} color="#F97316" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Version
                    </Text>
                    <Text className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {studentData.class_wise_data[0].version.version_name}
                    </Text>
                  </View>
                </View>
              )}

              {/* Shift */}
              {studentData.class_wise_data[0].shift?.shift_name && (
                <View className="flex-row items-center p-4">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isDark ? 'bg-pink-500/20' : 'bg-pink-50'
                  }`}>
                    <Ionicons name="sunny-outline" size={20} color="#EC4899" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs mb-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Shift
                    </Text>
                    <Text className={`font-medium ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {studentData.class_wise_data[0].shift.shift_name}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Parent Information (Only for Students) */}
        {userData?.type === 'STUDENT' && studentData && (
          <View className="px-4 mb-6">
            <Text className={`text-lg font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              Parent Information
            </Text>
            <View className={`rounded-2xl shadow-sm overflow-hidden border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Father's Info */}
              {studentData.father_name && (
                <View className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="man-outline" size={20} color="#DC2626" />
                    <Text className={`ml-2 font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Father
                    </Text>
                  </View>
                  <Text className={`ml-7 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {studentData.father_name}
                  </Text>
                  {studentData.father_mobile_number && (
                    <Text className={`ml-7 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      📞 {studentData.father_mobile_number}
                    </Text>
                  )}
                </View>
              )}

              {/* Mother's Info */}
              {studentData.mother_name && (
                <View className="p-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="woman-outline" size={20} color="#DC2626" />
                    <Text className={`ml-2 font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Mother
                    </Text>
                  </View>
                  <Text className={`ml-7 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {studentData.mother_name}
                  </Text>
                  {studentData.mother_mobile_number && (
                    <Text className={`ml-7 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      📞 {studentData.mother_mobile_number}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Settings */}
        <View className="px-4 mb-6">
          <Text className={`text-lg font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            Settings
          </Text>
          <View className={`rounded-2xl shadow-sm overflow-hidden border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Change Password Option */}
            <TouchableOpacity
              onPress={() => setPasswordModalVisible(true)}
              className="flex-row items-center p-4"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center mr-4">
                <Ionicons name="lock-closed-outline" size={20} color="white" />
              </View>
              <Text className={`flex-1 font-medium ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                Change Password
              </Text>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-4 mb-8">
          <TouchableOpacity 
            onPress={handleLogout}
            disabled={loading}
            className={`bg-red-600 rounded-xl py-4 items-center shadow-sm ${
              loading ? 'opacity-50' : ''
            }`}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">Logout</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Change Password Modal */}
        <Modal
          visible={passwordModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPasswordModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setPasswordModalVisible(false)}
            className="flex-1 justify-center items-center bg-black/50 px-4"
          >
            <TouchableOpacity activeOpacity={1} className="w-full max-w-md">
              <View className={`w-full rounded-3xl p-6 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Change Password
                  </Text>
                  <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                    <Ionicons name="close" size={28} color={isDark ? '#F9FAFB' : '#374151'} />
                  </TouchableOpacity>
                </View>

                {/* Current Password */}
                <View className="mb-4">
                  <Text className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Current Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                      className={`p-4 pr-12 rounded-xl border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                      placeholder="Enter current password"
                      placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-4"
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} 
                        size={22} 
                        color={isDark ? '#9CA3AF' : '#6B7280'} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View className="mb-4">
                  <Text className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    New Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      className={`p-4 pr-12 rounded-xl border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                      placeholder="Enter new password"
                      placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-4"
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                        size={22} 
                        color={isDark ? '#9CA3AF' : '#6B7280'} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View className="mb-6">
                  <Text className={`text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Confirm Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      className={`p-4 pr-12 rounded-xl border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                      placeholder="Confirm new password"
                      placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-4"
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                        size={22} 
                        color={isDark ? '#9CA3AF' : '#6B7280'} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Change Password Button */}
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={loading}
                  className={`bg-primary-600 rounded-xl py-4 items-center ${
                    loading ? 'opacity-50' : ''
                  }`}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-base">Change Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </CommonLayout>
  );
}