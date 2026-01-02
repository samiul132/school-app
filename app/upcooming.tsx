import { Ionicons } from '@expo/vector-icons';
import {
    Image,
    Text,
    View,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

export default function UpcomingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="flex-1 items-center justify-center px-6">
        {/* Icon */}
        <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
          isDark ? 'bg-primary-500/20' : 'bg-primary-50'
        }`}>
          <Ionicons 
            name="rocket-outline" 
            size={48} 
            color={isDark ? '#EF4444' : '#DC2626'} 
          />
        </View>

        {/* Logo */}
        <View className="w-20 h-20 mb-6 rounded-xl overflow-hidden bg-white shadow-lg">
          <Image
            source={require('../assets/images/logo.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* Main Text */}
        <Text className={`text-2xl font-bold text-center mb-3 ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}>
          Coming Soon!
        </Text>

        {/* Description */}
        <Text className={`text-base text-center mb-2 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          This feature is under development
        </Text>
        
        <Text className={`text-sm text-center px-8 ${
          isDark ? 'text-gray-500' : 'text-gray-500'
        }`}>
          We&apos;re working hard to bring you something amazing!
        </Text>

        {/* Progress Dots */}
        <View className="flex-row items-center mt-8 gap-2">
          <View className={`w-2 h-2 rounded-full ${isDark ? 'bg-primary-500' : 'bg-primary-600'}`} style={{ opacity: 0.4 }} />
          <View className={`w-2 h-2 rounded-full ${isDark ? 'bg-primary-500' : 'bg-primary-600'}`} style={{ opacity: 0.7 }} />
          <View className={`w-2 h-2 rounded-full ${isDark ? 'bg-primary-500' : 'bg-primary-600'}`} />
        </View>

        {/* Footer */}
        <View className="absolute bottom-8 items-center">
          <Text className={`text-sm font-medium ${
            isDark ? 'text-gray-400' : 'text-blue-600'
          }`}>
            Designcode IT • Smart Campus
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}