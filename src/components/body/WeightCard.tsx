import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDecimal } from '@/utils/formatUtils';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';

interface WeightCardProps {
  currentWeight: number | null;
  goalWeight: number | null;
  lastRecordedDate: number | null;
}

export function WeightCard({ currentWeight, goalWeight, lastRecordedDate }: WeightCardProps) {
  const { colors } = useTheme();

  const diff =
    currentWeight !== null && goalWeight !== null ? currentWeight - goalWeight : null;

  const formatDate = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const goalSubtitle = () => {
    if (diff === null) return null;
    if (Math.abs(diff) < 0.5) return '¡Objetivo alcanzado!';
    const kg = formatDecimal(Math.abs(diff));
    return diff > 0 ? `Faltan ${kg} kg para tu objetivo` : `${kg} kg por encima del objetivo`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Peso actual</Text>
      {currentWeight !== null ? (
        <View style={styles.weightRow}>
          <Text style={[styles.weightValue, { color: colors.primary }]}>
            {formatDecimal(currentWeight)}
          </Text>
          <Text style={[styles.unit, { color: colors.primary }]}>kg</Text>
        </View>
      ) : (
        <Text style={[styles.empty, { color: colors.textHint }]}>Sin datos</Text>
      )}
      {goalSubtitle() !== null && (
        <Text style={[styles.goalSubtitle, { color: colors.textSecondary }]}>
          {goalSubtitle()}
        </Text>
      )}
      {lastRecordedDate !== null && goalSubtitle() === null && (
        <Text style={[styles.dateLabel, { color: colors.textHint }]}>
          Registrado el {formatDate(lastRecordedDate)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[1],
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightValue: {
    fontSize: Typography.fontSize.metric,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize.metric * 1.15,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
  },
  goalSubtitle: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing[1],
  },
  dateLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  empty: {
    fontSize: Typography.fontSize.lg,
    fontStyle: 'italic',
  },
});
