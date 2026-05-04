import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BodyHomeScreen } from '@/screens/body/BodyHomeScreen';
import { LogWeightScreen } from '@/screens/body/LogWeightScreen';
import { WeightHistoryScreen } from '@/screens/body/WeightHistoryScreen';
import { MeasurementsScreen } from '@/screens/body/MeasurementsScreen';
import { WeightGoalScreen } from '@/screens/body/WeightGoalScreen';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/theme';
import type { BodyStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<BodyStackParamList>();

export function BodyStackNavigator() {
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
        name="BodyHome"
        component={BodyHomeScreen}
        options={{ title: 'Cuerpo' }}
      />
      <Stack.Screen
        name="LogWeight"
        component={LogWeightScreen}
        options={{ title: 'Registrar peso' }}
      />
      <Stack.Screen
        name="WeightHistory"
        component={WeightHistoryScreen}
        options={{ title: 'Historial de peso' }}
      />
      <Stack.Screen
        name="Measurements"
        component={MeasurementsScreen}
        options={{ title: 'Medidas corporales' }}
      />
      <Stack.Screen
        name="WeightGoal"
        component={WeightGoalScreen}
        options={{ title: 'Objetivo de peso' }}
      />
    </Stack.Navigator>
  );
}
