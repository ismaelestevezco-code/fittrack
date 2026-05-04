import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DayCard } from '@/components/workout/DayCard';
import { WeekSelector } from '@/components/workout/WeekSelector';
import { EmptyState } from '@/components/common/EmptyState';
import { AccentLine } from '@/components/common/AccentLine';
import { StatCard } from '@/components/common/StatCard';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/context/ThemeContext';
import { getWeekDays, getWeekStart, toDayTimestamp } from '@/utils/dateUtils';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { WorkoutStackParamList } from '@/types/navigation.types';

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;

export function WorkoutHomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const {
    activeRoutine,
    routineDays,
    exerciseCounts,
    weekOffset,
    weekSessions,
    weekTotalSets,
    weekTotalVolume,
    isLoading,
    loadActiveRoutine,
    loadWeekSessions,
    setWeekOffset,
  } = useWorkoutStore();

  useEffect(() => {
    loadActiveRoutine();
    loadWeekSessions(0);
  }, []);

  const weekStart = getWeekStart(weekOffset);
  const weekDays = getWeekDays(weekStart);

  const handleDayPress = useCallback(
    (dayIndex: number) => {
      const day = routineDays[dayIndex];
      if (!day) return;
      const date = toDayTimestamp(weekDays[dayIndex]);
      navigation.navigate('DayDetail', { routineDayId: day.id, date });
    },
    [routineDays, weekDays, navigation],
  );

  const handleWeekChange = useCallback(
    (offset: number) => {
      setWeekOffset(offset);
    },
    [setWeekOffset],
  );

  const completedCount = weekSessions.filter(s => s.finished_at != null).length;
  const totalDays = routineDays.filter(d => d.is_rest_day !== 1).length;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Entrenamientos</Text>
        <View style={styles.headerActions}>
          {activeRoutine ? (
            <Pressable
              onPress={() => navigation.navigate('WeekComparison')}
              hitSlop={8}
              style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated }]}
            >
              <MaterialCommunityIcons name="chart-bar" size={22} color={colors.textSecondary} />
            </Pressable>
          ) : null}
          {activeRoutine ? (
            <Pressable
              onPress={() => navigation.navigate('RoutineManager')}
              hitSlop={8}
              style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated }]}
            >
              <MaterialCommunityIcons name="playlist-edit" size={22} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!activeRoutine ? (
        <EmptyState
          icon="dumbbell"
          title="Sin rutina activa"
          description="Crea tu primera rutina para empezar a registrar tus entrenamientos."
          actionLabel="Crear rutina"
          onAction={() => navigation.navigate('RoutineManager')}
        />
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <WeekSelector weekOffset={weekOffset} onOffsetChange={handleWeekChange} />

          <Text style={[styles.routineName, { color: colors.textSecondary }]}>
            {activeRoutine.name}
          </Text>

          <AccentLine marginBottom={Spacing[3]} />

          {routineDays.map((day, index) => {
            const session = weekSessions.find(s => s.routine_day_id === day.id);
            return (
              <DayCard
                key={day.id}
                day={day}
                date={weekDays[index]}
                session={session}
                exerciseCount={exerciseCounts[day.id] ?? 0}
                onPress={() => handleDayPress(index)}
              />
            );
          })}

          <View style={styles.statsRow}>
            <StatCard value={`${completedCount}/${totalDays}`} label="Días completados" color="primary" />
            <StatCard value={weekTotalSets} label="Series totales" color="secondary" />
            <StatCard value={`${weekTotalVolume.toFixed(1)}`} label="Ton. movidas" color="warning" />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.borderRadius.full,
  },
  scroll: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[8],
  },
  routineName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
});
