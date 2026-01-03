import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  Text,
  useColorScheme,
  View,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import CommonLayout from '../components/CommonLayout';
import { 
  apiRequest, 
  getUserData, 
  getStudentProfileByIdApi 
} from '../config/api';

interface Subject {
  id: number;
  subject_name: string;
  subject_code: number;
  order_number: number;
  status: 'active' | 'inactive';
}

interface AssignedSubject extends Subject {
  assign_id: number;
  class_wise_student_id: number;
}

export default function SubjectsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    loadStudentSubjects();
  }, []);

  const loadStudentSubjects = async () => {
    try {
      setLoading(true);
      
      const user = await getUserData();
      
      if (!user || user.type !== 'STUDENT' || !user.student_id) {
        Alert.alert('Error', 'Student information not found');
        setLoading(false);
        return;
      }

      const studentResponse = await getStudentProfileByIdApi(user.student_id);
      
      if (!studentResponse.success || !studentResponse.data) {
        Alert.alert('Error', 'Failed to load student profile');
        setLoading(false);
        return;
      }

      setStudentData(studentResponse.data);
      
      const classWiseStudentId = studentResponse.data.class_wise_data?.[0]?.id;
      const classId = studentResponse.data.class_wise_data?.[0]?.class?.id;
      const sectionId = studentResponse.data.class_wise_data?.[0]?.section?.id;
      
      if (!classWiseStudentId) {
        Alert.alert('Info', 'No class assigned to this student');
        setLoading(false);
        return;
      }

      // First, get all subjects to have complete data
      const allSubjectsResponse = await apiRequest('/subjects', 'GET');
      
      const allSubjects = Array.isArray(allSubjectsResponse) 
        ? allSubjectsResponse 
        : (allSubjectsResponse?.data || []);
      
      // Create a map of subject ID to full subject data
      const subjectsById = new Map();
      allSubjects.forEach((subject: any) => {
        subjectsById.set(subject.id, subject);
      });

      // Get all subject assignments
      const subjectsResponse = await apiRequest('/subject-assigns', 'GET');

      let subjects: AssignedSubject[] = [];
      
      if (subjectsResponse?.success && subjectsResponse?.data) {
        let assignData = subjectsResponse.data;
        
        if (assignData.data && Array.isArray(assignData.data)) {
          assignData = assignData.data;
        } else if (!Array.isArray(assignData)) {
          assignData = [assignData];
        }

        const relevantAssignments = assignData.filter((assignment: any) => 
          assignment.class_id === classId && assignment.section_id === sectionId
        );

        const subjectMap = new Map<number, AssignedSubject>();
        
        for (const assignment of relevantAssignments) {
          if (assignment.details && Array.isArray(assignment.details)) {
            for (const detail of assignment.details) {
              if (detail.subject || detail.subject_id) {
                const subjectId = detail.subject?.id || detail.subject_id;
                
                // Get full subject data from our subjects map
                const fullSubject = subjectsById.get(subjectId);
                
                if (fullSubject) {
                  const subjectData = {
                    id: fullSubject.id,
                    subject_name: fullSubject.subject_name,
                    subject_code: fullSubject.subject_code,
                    order_number: fullSubject.order_number,
                    status: fullSubject.status || 'active',
                    assign_id: assignment.id,
                    class_wise_student_id: classWiseStudentId,
                  };
                  
                  subjectMap.set(fullSubject.id, subjectData);
                }
              }
            }
          }
        }
        
        subjects = Array.from(subjectMap.values()).sort(
          (a, b) => a.order_number - b.order_number
        );
      }

      setAssignedSubjects(subjects);
      
    } catch (error) {
      console.error('Error loading student subjects:', error);
      Alert.alert('Error', 'Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStudentSubjects();
  };

  const SubjectCard = ({ subject }: { subject: AssignedSubject }) => {
    return (
      <View
        className={`rounded-2xl p-5 mb-4 shadow-sm ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1 mr-3">
            <Text
              className={`text-xl font-bold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {subject.subject_name}
            </Text>

            <View className="flex-row items-center">
              <Ionicons
                name="code-outline"
                size={16}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                className={`text-sm ml-2 font-semibold ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Subject Code: {subject.subject_code}
              </Text>
            </View>
          </View>

          <View className={`w-14 h-14 rounded-xl items-center justify-center ${
            isDark ? 'bg-primary-500/20' : 'bg-primary-100'
          }`}>
            <Ionicons name="book" size={28} color="#DC2626" />
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <CommonLayout title="My Subjects" currentRoute="subjects">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DC2626" />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading your subjects...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="My Subjects" currentRoute="subjects">
      <View className="flex-1 px-4 pt-4">
        {/* Student Profile Header - Same as Dashboard */}
        <View className={`rounded-2xl border mb-4 ${
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
                  {studentData?.student_name || 'Student Name'}
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

        {/* Total Subjects Count */}
        <View
          className={`rounded-xl p-4 mb-4 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="book" size={24} color="#DC2626" />
              <Text
                className={`text-lg font-bold ml-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Total Subjects
              </Text>
            </View>
            <Text
              className={`text-3xl font-bold ${
                isDark ? 'text-primary-400' : 'text-primary-600'
              }`}
            >
              {assignedSubjects.length}
            </Text>
          </View>
        </View>

        {/* Subjects List */}
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
          {assignedSubjects.length > 0 ? (
            assignedSubjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons
                name="book-outline"
                size={64}
                color={isDark ? '#4B5563' : '#D1D5DB'}
              />
              <Text
                className={`text-lg font-semibold mt-4 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                No subjects assigned
              </Text>
              <Text
                className={`text-sm mt-2 text-center px-8 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                You have no subjects assigned yet. Please contact your administrator.
              </Text>
            </View>
          )}
          <View className="h-6" />
        </ScrollView>
      </View>
    </CommonLayout>
  );
}