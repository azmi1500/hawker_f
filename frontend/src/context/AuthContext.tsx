// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // Add this

interface User {
  id: number;
  username: string;
  role: string;
  fullName?: string;
  email?: string;
  shopName?: string;
   upiId?: string | null;
   clientId?: string | number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
  try {
    // ✅ ALWAYS clear storage on app start
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('loginTime');
    
    console.log('🧹 Storage cleared - always show login screen');
    setUser(null);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    setIsLoading(false);
  }
};

  // In AuthContext.tsx - When user logs in
const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('http://192.168.0.169:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (!response.ok) return false;

    // Make sure clientId is included
    const userData = {
      ...data.user,
      clientId: data.user.client_id || data.user.clientId || data.user.id  // 👈 Set clientId
    };

    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    return true;
  } catch (error) {
    return false;
  }
};

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
      console.log('✅ Logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};