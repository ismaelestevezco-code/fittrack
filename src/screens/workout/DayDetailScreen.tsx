import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExerciseItem } from '@/components/workout/ExerciseItem';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { SectionHeader } from '@/components/common/SectionHeader';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/context/ThemeContext';
import { formatDayShort, fromTimestamp } from '@/utils/dateUtils';
import { Layout, Spacing, Typography } from '@/constants/theme';
import { setLogRepository } from '@/repositories/SetLogRepository';
import type { WorkoutStackParamList } from '@/types/navigation.types';
import type { ExerciseRow, WorkoutSessionRow } from '@/types/database.types';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'DayDetail'>;

export function DayDetailScreen({ navigation, route }: Props) {
  const { routineDayId, date } = route.params;
  const { colors } = useTheme();
  const { routineDays, getDayExercises, getSessionExercises, getCompletedSessionForDay, startSession, abandonSession } = useWorkoutStore();

  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [existingSession, setExistingSession] = useState<WorkoutSessionRow | null>(null);
  const [lastWeights, setLastWeights] = useState<Record<number, number>>({});
  const [allTimeMax, setAllTimeMax] = useState<Record<number, number>>({});

  const day = routineDays.find(d => d.id === routineDayId);
  const isRestDay = day?.is_rest_day === 1;
  const isCompleted = existingSession?.finished_at != null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      // Fetch session directly from DB — weekSessions only covers the currently visible week
      const session = await getCompletedSessionForDay(routineDayId, date);
      if (cancelled) return;
      setExistingSession(session ?? null);

      let data: ExerciseRow[];
      if (session?.finished_at != null) {
        data = await getSessionExercises(session.id);
      } else {
        data = await getDayExercises(routineDayId);
      }
      if (cancelled) return;
      setExercises(data);

      // Load last-session weights and all-time PRs for non-rest days
      const [lw, atm] = await Promise.all([
        setLogRepository.getLastSessionWeightsForDay(routineDayId),
        setLogRepository.getAllTimeMaxWeightPerExercise(data.map(e => e.id)),
      ]);
      if (!cancelled) {
        setLastWeights(lw);
        setAllTimeMax(atm);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [routineDayId, date]);

  useEffect(() => {
    if (day) {
      navigation.setOptions({ title: day.name });
    }
  }, [day, navigation]);

  const handleStartWorkout = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    try {
      // Si hay una sesión sin finalizar (por crash previo), eliminarla antes de empezar
      if (existingSession && existingSession.finished_at == null) {
        await abandonSession(existingSession.id);
      }
      const session = await startSession(routineDayId, date);
      navigation.replace('ActiveWorkout', { routineDayId, sessionId: session.id });
    } finally {
      setStarting(false);
    }
  }, [starting, existingSession, routineDayId, date, startSession, abandonSession, navigation]);

  const handleViewSummary = useCallback(() => {
    if (!existingSession) return;
    navigation.navigate('WorkoutSummary', { sessionId: existingSession.id });
  }, [existingSession, navigation]);

  const handleEditDay = useCallback(() => {
    navigation.navigate('EditDay', { routineDayId });
  }, [routineDayId, navigation]);

  const handleExerciseHistory = useCallback((exerciseId: number) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (exercise) {
      navigation.navigate('ExerciseHistory', { exerciseId, exerciseName: exercise.name });
    }
  }, [exercises, navigation]);

  const dateLabel = formatDayShort(fromTimestamp(date));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{dateLabel}</Text>
          {isCompleted ? (
            <View style={[styles.badge, { backgroundColor: `${colors.accent}1A` }]}>
              <MaterialCommunityIcons name="check" size={12} color={colors.accent} />
              <Text style={[styles.badgeText, { color: colors.accent }]}>Completado</Text>
            </View>
          ) : null}
        </View>

        {isRestDay ? (
          <EmptyState
            icon="sleep"
            title="Día de descanso"
            description="Este día está marcado como descanso. Puedes cambiarlo desde 'Editar día'."
          />
        ) : (
          <>
        <SectionHeader
          title={`${exercises.length} ejercicio${exercises.length !== 1 ? 's' : ''}`}
          actionLabel="Editar día"
          onAction={handleEditDay}
        />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : exercises.length === 0 ? (
          <EmptyState
            icon="plus-circle-outline"
            title="Sin ejercicios"
            description="Añade ejercicios a este día para poder entrenar."
            actionLabel="Editar día"
            onAction={handleEditDay}
          />
        ) : (
          <View style={[styles.exerciseList, { backgroundColor: colors.surface }]}>
            {exercises.map(exercise => {
              const lw = lastWeights[exercise.id];
              const atm = allTimeMax[exercise.id];
              const isPR = lw != null && atm != null && lw > 0 && lw >= atm;
              return (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  onPress={handleExerciseHistory}
                  lastWeight={lw}
                  isPR={isPR}
                />
              );
            })}
          </View>
        )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {isRestDay ? (
          <Button
            label="Editar día"
            onPress={handleEditDay}
            variant="secondary"
          />
        ) : isCompleted ? (
          <>
            <Button
              label="Ver resumen"
              onPress={handleViewSummary}
              variant="secondary"
              style={styles.footerBtn}
            />
            <Button
              label="Repetir"
              onPress={handleStartWorkout}
              loading={starting}
              style={styles.footerBtn}
            />
          </>
        ) : (
          <Button
            label="Iniciar entrenamiento"
            onPress={handleStartWorkout}
            loading={starting}
            disabled={exercises.length === 0}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[4],
  },
  dateLabel: {
    fontSize: Typography.fontSize.sm,
    textTransform: 'capitalize',
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Layout.borderRadius.full,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  loader: {
    marginTop: Spacing[8],
  },
  exerciseList: {
    borderRadius: Layout.cardRadius,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderTopWidth: 0.5,
  },
  footerBtn: {
    flex: 1,
  },
});
