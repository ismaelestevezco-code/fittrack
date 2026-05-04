import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { ProfileSetupScreen } from '@/screens/onboarding/ProfileSetupScreen';
import { GoalSetupScreen } from '@/screens/onboarding/GoalSetupScreen';
import { MainTabNavigator } from '@/navigation/MainTabNavigator';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/context/ThemeContext';
import type {
  OnboardingStackParamList,
  RootStackParamList,
} from '@/types/navigation.types';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <OnboardingStack.Screen name="GoalSetup" component={GoalSetupScreen} />
    </OnboardingStack.Navigator>
  );
}

export function RootNavigator() {
  const { colors } = useTheme();
  const { profile, isLoading, loadProfile } = useProfileStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Muestra spinner mientras se consulta el perfil en SQLite al arrancar
  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
        {profile === null ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
