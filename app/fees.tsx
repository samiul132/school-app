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
  getPaymentsApi,
  getStudentFeeSummaryApi,
  getStudentProfileByIdApi,
  getUserData
} from '../config/api';
import '../global.css';

export default function FeesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [feeStats, setFeeStats] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalDue: 0,
  });

  useEffect(() => {
    loadFeeData();
  }, []);

  const loadFeeData = async () => {
    try {
      setLoading(true);
      
      // Get user data
      const user = await getUserData();
      if (user) {
        setUserData(user);
        
        // If user is student, fetch student profile and payments
        if (user.type === 'STUDENT' && user.student_id) {
          const studentResponse = await getStudentProfileByIdApi(user.student_id);
          if (studentResponse.success) {
            setStudentData(studentResponse.data);
            
            // Get class_wise_student_id
            const classWiseStudentId = studentResponse.data.class_wise_data?.[0]?.id;
            
            if (classWiseStudentId) {
              // Fetch fee summary from student_wise_fee_assigns
              try {
                const feeSummary = await getStudentFeeSummaryApi(classWiseStudentId);
                
                if (feeSummary.success) {
                  setFeeStats({
                    totalAmount: feeSummary.data.total_amount,
                    totalPaid: feeSummary.data.total_paid,
                    totalDue: feeSummary.data.total_due,
                  });
                }
              } catch (error) {
                console.error('Error fetching fee summary:', error);
              }
              
              // Fetch payment history
              const paymentsResponse = await getPaymentsApi({
                class_wise_student_id: classWiseStudentId,
              });
              
              if (paymentsResponse.success && paymentsResponse.data.data) {
                setPayments(paymentsResponse.data.data);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading fee data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh function to pass to CommonLayout
  const handleRefresh = async () => {
    await loadFeeData();
  };

  if (loading) {
    return (
      <CommonLayout title="Fees" currentRoute="fees" onRefresh={handleRefresh}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading fee information...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="Fees" currentRoute="fees" onRefresh={handleRefresh}>
      <ScrollView 
        className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View className="px-4 mt-4">
          {/* Total Amount Card - Full Width */}
          <View 
            className="rounded-2xl p-5 mb-3"
            style={{ backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Ionicons name="wallet" size={32} color="#6366F1" />
                <View className="ml-3">
                  <Text className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Total Amount
                  </Text>
                  <Text className={`text-3xl font-bold mt-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    ৳{feeStats.totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View className={`px-4 py-2 rounded-full ${
                isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'
              }`}>
                <Text className="text-sm font-semibold text-indigo-600">
                  2025
                </Text>
              </View>
            </View>
          </View>

          {/* Paid and Due Cards */}
          <View className="flex-row justify-between">
            {/* Total Paid Card */}
            <View 
              className="flex-1 rounded-2xl p-4 mr-2"
              style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }}
            >
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
              <Text className={`text-2xl font-bold mt-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                ৳{feeStats.totalPaid.toLocaleString()}
              </Text>
              <Text className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Paid
              </Text>
            </View>

            {/* Due Amount Card */}
            <View 
              className="flex-1 rounded-2xl p-4 ml-2"
              style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB' }}
            >
              <Ionicons name="alert-circle" size={28} color="#F59E0B" />
              <Text className={`text-2xl font-bold mt-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                ৳{feeStats.totalDue.toLocaleString()}
              </Text>
              <Text className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Due Amount
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Payment Card - Only show if there's due */}
        {feeStats.totalDue > 0 && (
          <View className={`mx-4 mt-4 rounded-2xl p-5 border ${
            isDark 
              ? 'bg-indigo-900/20 border-indigo-800' 
              : 'bg-indigo-50 border-indigo-200'
          }`}>
            <View className="flex-row items-center mb-3">
              <Ionicons name="calendar-outline" size={24} color="#6366F1" />
              <Text className={`text-lg font-bold ml-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Due Payment
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className={`text-base font-semibold ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Total Due
                </Text>
                <Text className={`text-sm mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Please clear your dues
                </Text>
              </View>
              <Text className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                ৳{feeStats.totalDue.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity 
              className="bg-indigo-600 rounded-xl py-3 flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="card-outline" size={20} color="white" />
              <Text className="text-white font-semibold text-base ml-2">
                Online Payment Upcooming...
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment History */}
        {payments.length > 0 ? (
          <View className={`mx-4 mt-6 rounded-2xl border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <View className={`flex-row items-center justify-between p-5 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={24} color="#6366F1" />
                <Text className={`text-lg font-bold ml-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Payment History
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                isDark ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <Text className="text-xs font-semibold text-green-600">
                  {payments.length} Paid
                </Text>
              </View>
            </View>

            {/* History Items */}
            <View className="p-5">
              {payments.map((payment, index) => (
                <View key={payment.id}>
                  <View className="flex-row justify-between items-center">
                    {/* Left Side */}
                    <View className="flex-row items-center flex-1">
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#10B981"
                      />
                      <View className="ml-3 flex-1">
                        <Text className={`text-base font-semibold ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {payment.month?.month_name || 'Payment'}
                        </Text>
                        <Text className={`text-xs mt-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {new Date(payment.payment_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })} • {payment.account?.account_name || 'Cash'}
                        </Text>
                      </View>
                    </View>

                    {/* Right Side */}
                    <View className="items-end">
                      <Text className={`text-lg font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        ৳{parseFloat(payment.total_paid_amount).toLocaleString()}
                      </Text>
                      <View
                        className={`px-3 py-1 rounded-full mt-1 ${
                          isDark ? 'bg-green-900/30' : 'bg-green-100'
                        }`}
                      >
                        <Text className="text-xs font-semibold text-green-600">
                          Paid
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Divider */}
                  {index < payments.length - 1 && (
                    <View className={`h-px my-4 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className={`mx-4 mt-6 rounded-2xl p-6 text-center ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Ionicons 
              name="document-text-outline" 
              size={48} 
              color={isDark ? '#6B7280' : '#9CA3AF'} 
              style={{ alignSelf: 'center', marginBottom: 12 }}
            />
            <Text className={`text-base font-semibold text-center ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No payment history found
            </Text>
          </View>
        )}

        {/* Help Section */}
        <View className={`mx-4 mt-4 mb-6 rounded-2xl p-5 border ${
          isDark 
            ? 'bg-blue-900/20 border-blue-800' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
            <Text className={`text-base font-bold ml-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Need Help?
            </Text>
          </View>
          <Text className={`text-sm leading-5 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            For any payment related queries, please contact the accounts office or call us at +880 1234-567890
          </Text>
        </View>
      </ScrollView>
    </CommonLayout>
  );
}