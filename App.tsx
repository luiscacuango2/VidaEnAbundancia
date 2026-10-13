// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import VolumeDetailScreen from './src/screens/main/VolumeDetailScreen';
import LessonDetailScreen from './src/screens/main/LessonDetailScreen';
import { ActivityIndicator, View } from 'react-native';
import { RootStackParamList } from './src/types/navigation';
import QuizScreen from './src/screens/main/QuizScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import AchievementsScreen from './src/screens/main/AchievementsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32',
    accent: '#66BB6A',
  },
};

function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="VolumeDetail" component={VolumeDetailScreen} />
          <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </PaperProvider>
  );
}