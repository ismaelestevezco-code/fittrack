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
import { Button } from '@/components/common/Button';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/context/ThemeContext';
import { formatDuration } from '@/utils/dateUtils';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { WorkoutStackParamList } from '@/types/navigation.types';
import type { ExerciseRow, SetLogRow } from '@/types/database.types';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutSummary'>;


function ExerciseSummary({
  exercise,
  currentSets,
  prevSets,
}: {
  exercise: ExerciseRow;
  currentSets: SetLogRow[];
  prevSets: SetLogRow[];
}) {
  const { colors } = useTheme();
  const currentVolume = currentSets.reduce((sum, s) => sum + s.reps_done * s.weight_kg, 0);
  const prevVolume = prevSets.reduce((sum, s) => sum + s.reps_done * s.weight_kg, 0);
  const delta = prevVolume > 0 ? currentVolume - prevVolume : null;

  return (
    <View style={[exerciseStyles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={exerciseStyles.header}>
        <Text style={[exerciseStyles.name, { color: colors.textPrimary }]}>{exercise.name}</Text>
        {delta !== null ? (
          <View style={[
            exerciseStyles.delta,
            { backgroundColor: delta >= 0 ? `${colors.accent}1A` : `${colors.danger}1A` },
          ]}>
            <MaterialCommunityIcons
              name={delta >= 0 ? 'trending-up' : 'trending-down'}
              size={14}
              color={delta >= 0 ? colors.accent : colors.danger}
            />
            <Text style={[
              exerciseStyles.deltaText,
              { color: delta >= 0 ? colors.accent : colors.danger },
            ]}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(0)} kg vol.
            </Text>
          </View>
        ) : null}
      </View>

      {currentSets.map(s => (
        <Text key={s.id} style={[exerciseStyles.set, { color: colors.textSecondary }]}>
          Serie {s.set_number}: {s.weight_kg > 0 ? `${s.weight_kg} kg` : 'PC'} × {s.reps_done} reps
        </Text>
      ))}

      {currentSets.length === 0 ? (
        <Text style={[exerciseStyles.noSets, { color: colors.textHint }]}>Sin series registradas</Text>
      ) : null}
    </View>
  );
}

export function WorkoutSummaryScreen({ navigation, route }: Props) {
  const { sessionId } = route.params;
  const { colors } = useTheme();
  const { activeSession, activeExercises, activeSetLogs, loadSession, getPreviousSessionSets, deleteSession, reopenSession } =
    useWorkoutStore();

  const [loading, setLoading] = useState(true);
  const [prevSets, setPrevSets] = useState<SetLogRow[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadSession(sessionId);
      setLoading(false);
    };
    init();
  }, [sessionId]);

  useEffect(() => {
    if (!activeSession) return;
    getPreviousSessionSets(activeSession.routine_day_id, sessionId).then(setPrevSets);
  }, [activeSession]);

  const handleBack = useCallback(() => {
    navigation.navigate('WorkoutHome');
  }, [navigation]);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteSession(sessionId);
      navigation.navigate('WorkoutHome');
    } finally {
      setDeleting(false);
    }
  }, [deleting, deleteSession, sessionId, navigation]);

  const handleEdit = useCallback(async () => {
    if (!activeSession || editing) return;
    setEditing(true);
    try {
      await reopenSession(sessionId);
      navigation.replace('ActiveWorkout', {
        routineDayId: activeSession.routine_day_id,
        sessionId,
        editMode: true,
      });
    } finally {
      setEditing(false);
    }
  }, [activeSession, editing, reopenSession, sessionId, navigation]);

  if (loading || !activeSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const durationSec =
    activeSession.finished_at != null
      ? activeSession.finished_at - activeSession.started_at
      : 0;

  const totalVolume = activeSetLogs
    .filter(s => s.is_warmup === 0)
    .reduce((sum, s) => sum + s.reps_done * s.weight_kg, 0);

  const totalSets = activeSetLogs.filter(s => s.is_warmup === 0).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <View style={styles.heroSection}>
          <MaterialCommunityIcons name="trophy" size={48} color={colors.warning} />
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            ¡Entrenamiento completado!
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={formatDuration(durationSec)} label="Duración" color="primary" />
          <StatCard value={`${totalVolume.toFixed(0)} kg`} label="Volumen" color="accent" />
          <StatCard value={String(totalSets)} label="Series" color="secondary" />
        </View>

        {activeExercises.length > 0 ? (
          <>
            <SectionHeader title="Ejercicios realizados" />
            {activeExercises.map(exercise => (
              <ExerciseSummary
                key={exercise.id}
                exercise={exercise}
                currentSets={activeSetLogs.filter(s => s.exercise_id === exercise.id)}
                prevSets={prevSets.filter(s => s.exercise_id === exercise.id)}
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.footerRow}>
          <Button
            label="Editar"
            onPress={handleEdit}
            loading={editing}
            variant="secondary"
            style={styles.footerBtnSmall}
          />
          <Button
            label="Volver"
            onPress={handleBack}
            style={styles.footerBtnGrow}
          />
        </View>
        <Button
          label="Eliminar entrenamiento"
          onPress={() => setShowDeleteConfirm(true)}
          variant="destructive"
        />
      </View>

      <ConfirmModal
        visible={showDeleteConfirm}
        title="¿Eliminar entrenamiento?"
        message="Se borrarán todas las series registradas en esta sesión. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </SafeAreaView>
  );
}


const exerciseStyles = StyleSheet.create({
  container: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  delta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.full,
  },
  deltaText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  set: {
    fontSize: Typography.fontSize.sm,
    paddingVertical: 2,
  },
  noSets: {
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[4],
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    gap: Spacing[3],
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderTopWidth: 0.5,
    gap: Spacing[2],
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  footerBtnSmall: {
    flex: 1,
  },
  footerBtnGrow: {
    flex: 2,
  },
});
