import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VolumeChart } from '@/components/workout/VolumeChart';
import { EmptyState } from '@/components/common/EmptyState';
import { useWorkoutProgress } from '@/hooks/useWorkoutProgress';
import { useTheme } from '@/context/ThemeContext';
import { fromTimestamp } from '@/utils/dateUtils';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { WorkoutStackParamList } from '@/types/navigation.types';
import type { VolumeMetric } from '@/components/workout/VolumeChart';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExerciseHistory'>;

const METRICS: Array<{ key: VolumeMetric; label: string; unit: string }> = [
  { key: 'maxWeightKg', label: 'Peso máximo', unit: 'kg' },
  { key: 'totalVolumeKg', label: 'Volumen', unit: 'kg' },
  { key: 'totalReps', label: 'Repeticiones', unit: 'reps' },
];

export function ExerciseHistoryScreen({ route }: Props) {
  const { exerciseId } = route.params;
  const { colors } = useTheme();
  const { progressPoints, recentSessions, isLoading } = useWorkoutProgress(exerciseId);
  const [metric, setMetric] = useState<VolumeMetric>('maxWeightKg');

  const formatDate = (ts: number) =>
    fromTimestamp(ts).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (progressPoints.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="chart-line"
          title="Sin historial"
          description="Completa al menos 2 entrenamientos con este ejercicio para ver la evolución."
        />
      </SafeAreaView>
    );
  }

  const latest = progressPoints[progressPoints.length - 1];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {METRICS.map(m => {
            const val = latest[m.key];
            return (
              <View key={m.key} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {m.key === 'totalReps' ? Math.round(val) : val.toFixed(1)}
                  <Text style={[styles.statUnit, { color: colors.textSecondary }]}> {m.unit}</Text>
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{m.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.toggleRow}>
          {METRICS.map(m => {
            const active = metric === m.key;
            return (
              <Pressable
                key={m.key}
                style={[
                  styles.toggleBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setMetric(m.key)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: colors.textSecondary },
                    active && { color: colors.background },
                  ]}
                  numberOfLines={1}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {progressPoints.length < 2 ? (
            <Text style={[styles.chartEmpty, { color: colors.textSecondary }]}>
              Necesitas al menos 2 sesiones para ver la gráfica.
            </Text>
          ) : (
            <VolumeChart data={progressPoints} metric={metric} height={200} />
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Últimas sesiones</Text>
        {recentSessions.map(({ session, sets }) => {
          const totalVol = sets.reduce((s, l) => s + l.weight_kg * l.reps_done, 0);
          const maxW = sets.length > 0 ? Math.max(...sets.map(l => l.weight_kg)) : 0;
          return (
            <View key={session.id} style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sessionHeader}>
                <Text style={[styles.sessionDate, { color: colors.textPrimary }]}>
                  {formatDate(session.date)}
                </Text>
                <View style={styles.sessionMeta}>
                  <Text style={[styles.sessionMetaText, { color: colors.textSecondary }]}>
                    {maxW.toFixed(1)} kg max
                  </Text>
                  <Text style={[styles.sessionMetaDot, { color: colors.textHint }]}>·</Text>
                  <Text style={[styles.sessionMetaText, { color: colors.textSecondary }]}>
                    {totalVol.toFixed(0)} kg vol
                  </Text>
                </View>
              </View>
              {sets.map(set => (
                <View key={set.id} style={[styles.setRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.setNumber, { color: colors.textHint }]}>
                    Serie {set.set_number}
                  </Text>
                  <Text style={[styles.setDetail, { color: colors.textPrimary }]}>
                    {set.weight_kg.toFixed(1)} kg × {set.reps_done} reps
                  </Text>
                  <Text style={[styles.setVolume, { color: colors.textSecondary }]}>
                    {(set.weight_kg * set.reps_done).toFixed(0)} kg
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
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
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
    gap: Spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
  statUnit: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.regular,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  toggleBtn: {
    flex: 1,
    height: 36,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[1],
  },
  toggleText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  chartCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  chartEmpty: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing[6],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  sessionCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  sessionDate: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  sessionMetaText: {
    fontSize: Typography.fontSize.xs,
  },
  sessionMetaDot: {
    fontSize: Typography.fontSize.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    borderTopWidth: 0.5,
  },
  setNumber: {
    fontSize: Typography.fontSize.xs,
    width: 52,
  },
  setDetail: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
  },
  setVolume: {
    fontSize: Typography.fontSize.xs,
  },
});
