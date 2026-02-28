// src/context/SettingsContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  theme: string;
  language: string;
  setTheme: (theme: string) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState('light');
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedLanguage = await AsyncStorage.getItem('language');
      
      if (savedTheme) setThemeState(savedTheme);
      if (savedLanguage) setLanguageState(savedLanguage);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const setTheme = async (newTheme: string) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const setLanguage = async (newLanguage: string) => {
    setLanguageState(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
  };

  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};