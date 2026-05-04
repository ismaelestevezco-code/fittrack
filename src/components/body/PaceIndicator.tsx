import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';

interface PaceIndicatorProps {
  weeklyRate: number | null;
  requiredRate: number | null;
  daysUntilGoal: number | null;
}

type Status = 'on_track' | 'behind' | 'ahead' | 'no_data' | 'goal_reached';

function getStatus(
  weeklyRate: number | null,
  requiredRate: number | null,
  daysUntilGoal: number | null,
): Status {
  if (daysUntilGoal !== null && daysUntilGoal === 0) return 'goal_reached';
  if (weeklyRate === null || requiredRate === null) return 'no_data';
  if (Math.abs(requiredRate) < 0.05) return 'on_track';
  const ratio = weeklyRate / requiredRate;
  if (ratio >= 0.8) return 'on_track';
  if (ratio >= 0.4 || ratio < 0) return 'behind';
  return 'ahead';
}

export function PaceIndicator({ weeklyRate, requiredRate, daysUntilGoal }: PaceIndicatorProps) {
  const { colors } = useTheme();
  const status = getStatus(weeklyRate, requiredRate, daysUntilGoal);

  const statusConfig = {
    on_track: { icon: 'check-circle' as const, color: colors.accent, label: 'En buen ritmo' },
    behind: { icon: 'alert-circle' as const, color: colors.warning, label: 'Ritmo insuficiente' },
    ahead: { icon: 'lightning-bolt' as const, color: colors.secondary, label: 'Ritmo acelerado' },
    no_data: { icon: 'chart-line' as const, color: colors.textHint, label: 'Sin datos suficientes' },
    goal_reached: { icon: 'trophy' as const, color: colors.accent, label: '¡Objetivo alcanzado!' },
  }[status];

  const formatRate = (rate: number) => {
    const abs = Math.abs(rate);
    const sign = rate < 0 ? '−' : '+';
    return `${sign}${abs.toFixed(2)} kg/sem`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name={statusConfig.icon} size={16} color={statusConfig.color} />
        <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
      </View>

      <View style={styles.rates}>
        <View style={styles.rateItem}>
          <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Ritmo actual</Text>
          <Text style={[styles.rateValue, { color: colors.textPrimary }]}>
            {weeklyRate !== null ? formatRate(weeklyRate) : '—'}
          </Text>
        </View>
        <View style={[styles.rateDivider, { backgroundColor: colors.border }]} />
        <View style={styles.rateItem}>
          <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Ritmo necesario</Text>
          <Text style={[styles.rateValue, { color: colors.textPrimary }]}>
            {requiredRate !== null ? formatRate(requiredRate) : '—'}
          </Text>
        </View>
        {daysUntilGoal !== null && (
          <>
            <View style={[styles.rateDivider, { backgroundColor: colors.border }]} />
            <View style={styles.rateItem}>
              <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Días restantes</Text>
              <Text style={[styles.rateValue, { color: colors.textPrimary }]}>{daysUntilGoal}d</Text>
            </View>
          </>
        )}
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
    alignItems: 'center',
    gap: Spacing[2],
  },
  statusLabel: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  rates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateItem: {
    flex: 1,
    gap: 2,
  },
  rateLabel: {
    fontSize: Typography.fontSize.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rateValue: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  rateDivider: {
    width: 1,
    height: 32,
    marginHorizontal: Spacing[3],
  },
});
