import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';

interface GoalProgressCardProps {
  currentWeight: number | null;
  initialWeight: number | null;
  goalWeight: number | null;
  progressPercent: number | null;
}

export function GoalProgressCard({
  currentWeight,
  initialWeight,
  goalWeight,
  progressPercent,
}: GoalProgressCardProps) {
  const { colors } = useTheme();
  if (goalWeight === null) return null;

  const pct = progressPercent ?? 0;
  const barWidth = `${Math.min(100, Math.max(0, pct))}%` as `${number}%`;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>Progreso hacia el objetivo</Text>
        <Text style={[styles.percent, { color: colors.primary }]}>{pct.toFixed(0)}%</Text>
      </View>

      <View style={[styles.barTrack, { backgroundColor: colors.surfaceHigh }]}>
        <View style={[styles.barFill, { width: barWidth, backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.labels}>
        <Text style={[styles.labelText, { color: colors.textHint }]}>
          Inicio{initialWeight !== null ? `: ${initialWeight.toFixed(1)} kg` : ''}
        </Text>
        <Text style={[styles.labelText, { color: colors.textHint }]}>
          {currentWeight !== null ? `Hoy: ${currentWeight.toFixed(1)} kg` : ''}
        </Text>
        <Text style={[styles.labelText, { color: colors.textHint }]}>Meta: {goalWeight.toFixed(1)} kg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
  },
  percent: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
  barTrack: {
    height: 8,
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Layout.borderRadius.full,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: Typography.fontSize.xs,
  },
});
