import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// API Configuration
// ============================================
export const API_BASE_URL = 'https://smartcampus.designcodeit.com/api';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    CUSTOM_LOGIN: '/custom-login',
    CUSTOM_LOGOUT: '/custom-logout',
    CUSTOM_LOGOUT_ALL: '/custom-logout-all',
    CUSTOM_USER: '/custom-user',
    CUSTOM_CHANGE_PASSWORD: '/custom-change-password',
    
    LOGIN: '/login',
    LOGOUT: '/logout',
    REGISTER: '/register',
    USER: '/user',
    
    UPDATE_PROFILE: '/user/update-profile',
    
    // School Management
    SCHOOL_SETTINGS: '/current-school-settings',
    ACCOUNT_HEADS: '/accountheads',
    STUDENT_PROFILES: '/student-profiles',
    STUDENT_PROFILES_DROPDOWN: '/student-profiles/dropdown/data',
    
    // Other endpoints...
  },
};

// ============================================
// Storage Helper Functions
// ============================================

/**
 * Get stored auth token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Store auth token
 */
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
};

/**
 * Get stored user data
 */
export const getUserData = async (): Promise<any | null> => {
  try {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Store user data
 */
export const setUserData = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

/**
 * Clear auth data (logout)
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['auth_token', 'user_data']);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// ============================================
// API Request Functions
// ============================================

/**
 * Make authenticated API request
 */
export const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  customHeaders?: Record<string, string>
): Promise<any> => {
  try {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Make raw fetch request (returns Response object)
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
};

// ============================================
// Authentication API Functions
// ============================================

/**
 * Custom Login API (for React Native App)
 */
export const customLoginApi = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOM_LOGIN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Login failed');
  }

  // Store auth data
  if (data.data?.token) {
    await setAuthToken(data.data.token);
  }
  if (data.data?.user) {
    await setUserData(data.data.user);
  }

  return data;
};

/**
 * Custom Logout API
 */
export const customLogoutApi = async () => {
  try {
    const response = await apiFetch(API_CONFIG.ENDPOINTS.CUSTOM_LOGOUT, {
      method: 'POST',
    });
    const data = await response.json();
    
    // Clear local auth data regardless of API response
    await clearAuthData();
    
    return data;
  } catch (error) {
    // Even if API fails, clear local data
    await clearAuthData();
    throw error;
  }
};

/**
 * Get current user API
 */
export const getCurrentUserApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.CUSTOM_USER, 'GET');
};

/**
 * Change password API
 */
export const changePasswordApi = async (
  currentPassword: string,
  newPassword: string,
  newPasswordConfirmation: string
) => {
  return apiRequest(API_CONFIG.ENDPOINTS.CUSTOM_CHANGE_PASSWORD, 'POST', {
    current_password: currentPassword,
    new_password: newPassword,
    new_password_confirmation: newPasswordConfirmation,
  });
};

/**
 * Update user profile API
 */
export const updateProfileApi = async (profileData: {
  name?: string;
  email?: string;
  user_name?: string;
}) => {
  const response = await apiRequest(
    API_CONFIG.ENDPOINTS.UPDATE_PROFILE,
    'PUT',
    profileData
  );
  
  // Update local storage with new data
  if (response.success && response.data) {
    await setUserData(response.data);
  }
  
  return response;
};

// ============================================
// School Management API Functions
// ============================================

/**
 * Get school settings
 */
export const getSchoolSettingsApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.SCHOOL_SETTINGS, 'GET');
};

/**
 * Get account heads dropdown
 */
export const getAccountHeadsApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.ACCOUNT_HEADS, 'GET');
};

/**
 * Get student profiles dropdown data
 */
export const getStudentProfilesDropdownApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.STUDENT_PROFILES_DROPDOWN, 'GET');
};

/**
 * Get all student profiles
 */
export const getStudentProfilesApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.STUDENT_PROFILES, 'GET');
};

// ============================================
// Utility Functions
// ============================================

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Handle API errors
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};


// ============================================
// Student Profile API Functions
// ============================================

/**
 * Get single student profile by ID
 */
export const getStudentProfileByIdApi = async (studentId: number | string) => {
  try {
    const response = await apiRequest(`/student-profiles/${studentId}`, 'GET');
    return response;
  } catch (error) {
    console.error('Error fetching student profile:', error);
    throw error;
  }
};

/**
 * Get student fee summary
 */
export const getStudentFeeSummaryApi = async (classWiseStudentId: number | string) => {
  try {
    const response = await apiRequest(`/payments/student-fee-summary/${classWiseStudentId}`, 'GET');
    return response;
  } catch (error) {
    console.error('Error fetching student fee summary:', error);
    throw error;
  }
};

/**
 * Get student fee information
 */
export const getStudentFeesApi = async (params: {
  month_id: number;
  id_card_number?: string;
  session_id?: number;
  class_id?: number;
  version_id?: number;
  section_id?: number;
  roll?: number;
}) => {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString();
  
  return apiRequest(`/payments/student-fees?${queryString}`, 'GET');
};

/**
 * Get student payment history
 */
export const getStudentPaymentHistoryApi = async (studentId: number | string) => {
  return apiRequest(`/payments/student/${studentId}/history`, 'GET');
};

/**
 * Get all payments with filters
 */
export const getPaymentsApi = async (params?: {
  class_wise_student_id?: number;
  session_id?: number;
  class_id?: number;
  month_id?: number;
  start_date?: string;
  end_date?: string;
}) => {
  const queryString = params 
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => [key, String(value)])
      ).toString()
    : '';
    
  return apiRequest(`/payments${queryString}`, 'GET');
};



/**
 * Save Expo Push Token
 */
export const savePushTokenApi = async (expoPushToken: string) => {
  return apiRequest('/save-push-token', 'POST', {
    expo_push_token: expoPushToken,
  });
};

/**
 * Remove Expo Push Token
 */
export const removePushTokenApi = async (expoPushToken: string) => {
  return apiRequest('/remove-push-token', 'POST', {
    expo_push_token: expoPushToken,
  });
};

/**
 * Get all post notifications
 */
export const getPostNotificationsApi = async () => {
  return apiRequest('/post-notifications', 'GET');
};

/**
 * Get all teachers (staff with is_teachers = 1)
 */
export const getTeachersApi = async () => {
  return apiRequest('/staffs', 'GET');
};

/**
 * Get single staff/teacher by ID
 */
export const getStaffByIdApi = async (staffId: number | string) => {
  return apiRequest(`/staffs/${staffId}`, 'GET');
};

/**
 * Get designations dropdown
 */
export const getDesignationsApi = async () => {
  return apiRequest('/designations', 'GET');
};

/**
 * Get all class routines
 */
export const getClassRoutinesApi = async () => {
  return apiRequest('/class-routines', 'GET');
};

/**
 * Get single class routine by ID
 */
export const getClassRoutineByIdApi = async (routineId: number | string) => {
  return apiRequest(`/class-routines/${routineId}`, 'GET');
};