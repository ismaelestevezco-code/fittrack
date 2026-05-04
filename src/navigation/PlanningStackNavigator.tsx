import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlanningHomeScreen } from '@/screens/planning/PlanningHomeScreen';
import { PlanningHistoryScreen } from '@/screens/planning/PlanningHistoryScreen';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/theme';
import type { PlanningStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<PlanningStackParamList>();

export function PlanningStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: {
          fontSize: Typography.fontSize.md,
          fontWeight: Typography.fontWeight.semibold,
          color: colors.textPrimary,
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="PlanningHome"
        component={PlanningHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlanningHistory"
        component={PlanningHistoryScreen}
        options={{ title: 'Historial de plannings' }}
      />
    </Stack.Navigator>
  );
}
