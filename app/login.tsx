import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { customLoginApi, handleApiError } from '../config/api';
import '../global.css';

export default function LoginScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!userName.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Validation Error',
        text2: 'Please enter your username or name',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    
    if (!password.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Validation Error',
        text2: 'Please enter your password',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await customLoginApi(userName, password);

      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: data.message || 'Login successful',
          position: 'top',
          visibilityTime: 2000,
        });
        
        setTimeout(() => {
          router.replace('/dashboard');
        }, 500);
      }
    } catch (error) {
      console.error('Login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: handleApiError(error),
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-primary-50 to-secondary-50">
      <View className="flex-1 justify-center px-6">
        {/* Logo + School Name */}
        <View className="items-center mb-10">
          <View className="bg-white rounded-3xl p-4 shadow-lg mb-4">
            <Image
              source={require('../assets/images/logo.png')}
              className="w-20 h-20"
              resizeMode="contain"
            />
          </View>
          <Text className="text-2xl font-bold text-gray-800 tracking-wide">
            IQRA MODEL SCHOOL
          </Text>
          <View className="w-16 h-1 bg-primary-500 rounded-full mt-2" />
        </View>

        {/* Welcome Section */}
        <View className="items-center mb-6">
          <Text className="text-4xl font-bold text-gray-900">
            Welcome Back
          </Text>
          <Text className="text-gray-500 mt-3 text-base">
            Sign in to continue
          </Text>
        </View>

        {/* Input Card */}
        <View className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          {/* Username or Name */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-3 font-semibold text-base">Username or Name</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 text-gray-800 ml-3 text-base"
                placeholder="Enter Username or Name"
                placeholderTextColor="#9CA3AF"
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password */}
          <View>
            <Text className="text-gray-700 mb-3 font-semibold text-base">Password</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 text-gray-800 ml-3 text-base"
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="bg-primary-500 rounded-xl py-4 items-center shadow-2xl mb-8"
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={isLoading}
          style={{
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          <View className="flex-row items-center">
            {isLoading ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-bold text-lg ml-2">
                  Logging in...
                </Text>
              </>
            ) : (
              <>
                <Text className="text-white font-bold text-lg mr-2">
                  Login
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="items-center pb-6 px-6">
        <View className="w-full border-t border-gray-200 pt-4">
          <TouchableOpacity
            className="items-center mb-2"
          >
            <Text className="text-primary-600 text-sm font-medium">
              © 2025 IQRA MODEL SCHOOL
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center mt-2">
            <Ionicons name="flash" size={14} color="rgb(180, 50, 180)" />
            <TouchableOpacity
            onPress={() => Linking.openURL('http://designcodeit.com/')}>
              
            <Text className="text-red-400 text-xs ml-1 text-center">
              Powered by Designcode IT
            </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-blue-400 text-xs text-center mt-1">
            Chengarchar Bazar, Matlab Uttar
          </Text>
        </View>
        
        <View className="flex-row items-center justify-center mb-2">
          <Text className="text-secondary-700 text-xs font-semibold">
            01935102910
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}