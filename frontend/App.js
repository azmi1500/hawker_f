// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import LoginScreen from './src/screens/LoginScreen';
import PosScreen from './src/screens/PosScreen';
import { View, ActivityIndicator, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  console.log('🔄 AppNavigator - User:', user ? user.username : 'No user');
  console.log('🔄 AppNavigator - Loading:', isLoading);

  if (isLoading || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF4444" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ animation: 'slide_from_right' }}
        />
      ) : (
        <Stack.Screen 
          name="POS" 
          component={PosScreen}
          options={{ animation: 'slide_from_right' }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}