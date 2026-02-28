// frontend/src/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// We'll use this to navigate
let navigateToLogin = null;

export const setNavigationCallback = (callback) => {
  navigateToLogin = callback;
};

 // Backend port

const getBaseURL = () => {
  // For production - use company server
  if (__DEV__) {
    // Development - use local IP
    if (Platform.OS === 'android') {
      return 'http://192.168.0.169:5000/api';  // Your local backend IP
    }
    return 'http://localhost:5000/api';  // For iOS simulator
  } else {
    // Production - use company server
    
  }
};

const BASE_URL = getBaseURL();
console.log('📱 Platform:', Platform.OS);
console.log('🌐 API Base URL:', BASE_URL);
console.log('🚀 Environment:', __DEV__ ? 'Development' : 'Production');

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Add token to every request
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    console.log('🔑 Token found:', token ? 'Yes' : 'No');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('➡️ Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.log('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
API.interceptors.response.use(
  (response) => {
    console.log('✅ Response Success:', response.status);
    return response;
  },
  async (error) => {
    console.log('❌ Response Error:', error.response?.status, error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - Token invalid or expired');
      
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      if (navigateToLogin) {
        console.log('🔄 Redirecting to login...');
        navigateToLogin();
      }
    }
    
    return Promise.reject(error);
  }
);

// For file uploads
export const uploadAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

uploadAPI.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

uploadAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      if (navigateToLogin) {
        navigateToLogin();
      }
    }
    return Promise.reject(error);
  }
);

export default API;