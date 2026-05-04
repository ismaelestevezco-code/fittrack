import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';

interface StatCardProps {
  value: string | number;
  label: string;
  color?: 'primary' | 'secondary' | 'warning' | 'accent';
}

export function StatCard({ value, label, color = 'primary' }: StatCardProps) {
  const { colors } = useTheme();

  const valueColor =
    color === 'secondary'
      ? colors.secondary
      : color === 'warning'
        ? colors.warning
        : color === 'accent'
          ? colors.accent
          : colors.primary;

  const borderColor =
    color === 'secondary'
      ? `${colors.warning}40`
      : color === 'warning'
        ? `${colors.warning}40`
        : color === 'accent'
          ? `${colors.accent}40`
          : `${colors.primary}40`;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor }]}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: Layout.statCardMinHeight,
    borderRadius: 10,
    borderWidth: 0.5,
    padding: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  value: {
    fontSize: Typography.fontSize.metric,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  label: {
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
