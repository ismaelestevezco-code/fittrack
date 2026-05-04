import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutHomeScreen } from '@/screens/workout/WorkoutHomeScreen';
import { DayDetailScreen } from '@/screens/workout/DayDetailScreen';
import { ActiveWorkoutScreen } from '@/screens/workout/ActiveWorkoutScreen';
import { WorkoutSummaryScreen } from '@/screens/workout/WorkoutSummaryScreen';
import { EditDayScreen } from '@/screens/workout/EditDayScreen';
import { RoutineManagerScreen } from '@/screens/workout/RoutineManagerScreen';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/theme';
import type { WorkoutStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

function ExerciseHistoryStub() {
  const { colors } = useTheme();
  return (
    <View style={[stubStyles.container, { backgroundColor: colors.background }]}>
      <Text style={[stubStyles.text, { color: colors.textPrimary }]}>Historial de ejercicio</Text>
      <Text style={[stubStyles.sub, { color: colors.textSecondary }]}>Disponible en Fase 4</Text>
    </View>
  );
}

function WeekComparisonStub() {
  const { colors } = useTheme();
  return (
    <View style={[stubStyles.container, { backgroundColor: colors.background }]}>
      <Text style={[stubStyles.text, { color: colors.textPrimary }]}>Comparativa semanal</Text>
      <Text style={[stubStyles.sub, { color: colors.textSecondary }]}>Disponible en Fase 4</Text>
    </View>
  );
}

const stubStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 14, marginTop: 8 },
});

export function WorkoutStackNavigator() {
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
      <Stack.Screen
        name="WorkoutHome"
        component={WorkoutHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={{ title: 'Detalle del día' }}
      />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ title: 'Entrenamiento activo', gestureEnabled: false }}
      />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{ title: 'Resumen', headerBackVisible: false }}
      />
      <Stack.Screen
        name="EditDay"
        component={EditDayScreen}
        options={{ title: 'Editar día' }}
      />
      <Stack.Screen
        name="RoutineManager"
        component={RoutineManagerScreen}
        options={{ title: 'Mis rutinas' }}
      />
      <Stack.Screen
        name="ExerciseHistory"
        component={ExerciseHistoryStub}
        options={{ title: 'Historial' }}
      />
      <Stack.Screen
        name="WeekComparison"
        component={WeekComparisonStub}
        options={{ title: 'Comparativa' }}
      />
    </Stack.Navigator>
  );
}
