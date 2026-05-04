import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileHomeScreen } from '@/screens/profile/ProfileHomeScreen';
import { SettingsScreen } from '@/screens/profile/SettingsScreen';
import { EditPreferencesScreen } from '@/screens/profile/EditPreferencesScreen';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/theme';
import type { ProfileStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontSize: Typography.fontSize.md,
          fontWeight: Typography.fontWeight.semibold,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuración' }} />
      <Stack.Screen name="EditPreferences" component={EditPreferencesScreen} options={{ title: 'Cambiar preferencias' }} />
    </Stack.Navigator>
  );
}
