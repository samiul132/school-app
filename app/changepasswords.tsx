import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import Toast from 'react-native-toast-message';
import CommonLayout from '../components/CommonLayout';
import { changePasswordApi } from '../config/api';
import '../global.css';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    let isValid = true;

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async () => {
    // Clear previous errors
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    // Validate form
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors before submitting',
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
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: response.message || 'Password changed successfully',
          position: 'top',
          visibilityTime: 3000,
        });

        setTimeout(() => {
          router.push('/dashboard' as Href);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to change password',
        position: 'top',
        visibilityTime: 4000,
      });

      // Handle specific error cases
      if (error.message && error.message.toLowerCase().includes('current password')) {
        setErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect',
        }));
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <CommonLayout title="Change Password" currentRoute="changepasswords">
      <ScrollView 
        className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
        showsVerticalScrollIndicator={false}
      >


        {/* Change Password Form */}
        <View className="px-4 pt-6 pb-8">
          {/* Header Info Card */}
          <View className="px-4 pt-6 pb-4">
            <View className={`rounded-2xl p-5 border ${
                isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
                <View className="flex-row items-center mb-3">
                <View className={`w-12 h-12 rounded-full items-center justify-center ${
                    isDark ? 'bg-primary-500/20' : 'bg-primary-50'
                }`}>
                    <Ionicons name="shield-checkmark" size={24} color="#DC2626" />
                </View>
                <View className="flex-1 ml-4">
                    <Text className={`text-lg font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    Secure Your Account
                    </Text>
                </View>
                </View>
                
                <View className={`p-3 rounded-lg ${
                isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}>
                <Text className={`text-sm ${
                    isDark ? 'text-blue-300' : 'text-blue-800'
                }`}>
                    💡 Choose a strong password with at least 8 characters, including uppercase, lowercase, and numbers.
                </Text>
                </View>
            </View>
          </View>
          <View className={`rounded-2xl p-6 shadow-sm border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Current Password */}
            <View className="mb-5">
              <Text className={`text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Current Password *
              </Text>
              <View className="relative">
                <TextInput
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    if (errors.currentPassword) {
                      setErrors(prev => ({ ...prev, currentPassword: '' }));
                    }
                  }}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  className={`p-4 pr-12 rounded-xl border ${
                    errors.currentPassword
                      ? 'border-red-500'
                      : isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                  placeholder="Enter your current password"
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
              {errors.currentPassword ? (
                <Text className="text-red-500 text-xs mt-1 ml-1">
                  {errors.currentPassword}
                </Text>
              ) : null}
            </View>

            {/* New Password */}
            <View className="mb-5">
              <Text className={`text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                New Password *
              </Text>
              <View className="relative">
                <TextInput
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) {
                      setErrors(prev => ({ ...prev, newPassword: '' }));
                    }
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  className={`p-4 pr-12 rounded-xl border ${
                    errors.newPassword
                      ? 'border-red-500'
                      : isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                  placeholder="Enter your new password"
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
              {errors.newPassword ? (
                <Text className="text-red-500 text-xs mt-1 ml-1">
                  {errors.newPassword}
                </Text>
              ) : null}
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className={`text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm New Password *
              </Text>
              <View className="relative">
                <TextInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  className={`p-4 pr-12 rounded-xl border ${
                    errors.confirmPassword
                      ? 'border-red-500'
                      : isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                  placeholder="Confirm your new password"
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
              {errors.confirmPassword ? (
                <Text className="text-red-500 text-xs mt-1 ml-1">
                  {errors.confirmPassword}
                </Text>
              ) : null}
              {confirmPassword.length > 0 && newPassword === confirmPassword && !errors.confirmPassword && (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text className="text-green-500 text-xs ml-1">Passwords match</Text>
                </View>
              )}
            </View>

            {/* Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={loading}
                className={`bg-primary-600 rounded-xl py-4 items-center shadow-sm ${
                  loading ? 'opacity-50' : ''
                }`}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="shield-checkmark" size={20} color="white" />
                    <Text className="text-white font-bold text-base ml-2">
                      Update Password
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                disabled={loading}
                className={`border-2 rounded-xl py-4 items-center ${
                  isDark 
                    ? 'border-gray-600' 
                    : 'border-gray-300'
                } ${loading ? 'opacity-50' : ''}`}
                activeOpacity={0.8}
              >
                <Text className={`font-semibold text-base ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>


      </ScrollView>
    </CommonLayout>
  );
}