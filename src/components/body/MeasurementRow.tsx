import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';

interface MeasurementRowProps {
  label: string;
  value: number | null;
  previousValue?: number | null;
  unit?: string;
}

export function MeasurementRow({
  label,
  value,
  previousValue,
  unit = 'cm',
}: MeasurementRowProps) {
  const { colors } = useTheme();

  const delta =
    value !== null && previousValue !== null && previousValue !== undefined
      ? value - previousValue
      : null;

  const getDeltaColor = (d: number) => {
    if (Math.abs(d) < 0.1) return colors.textHint;
    return colors.textSecondary;
  };

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.right}>
        {value !== null ? (
          <>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {value.toFixed(1)} {unit}
            </Text>
            {delta !== null && (
              <View style={styles.deltaRow}>
                <MaterialCommunityIcons
                  name={delta > 0.05 ? 'arrow-up' : delta < -0.05 ? 'arrow-down' : 'minus'}
                  size={10}
                  color={getDeltaColor(delta)}
                />
                <Text style={[styles.deltaText, { color: getDeltaColor(delta) }]}>
                  {Math.abs(delta).toFixed(1)}
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={[styles.empty, { color: colors.textHint }]}>—</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 0.5,
  },
  label: {
    fontSize: Typography.fontSize.base,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  value: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  deltaText: {
    fontSize: Typography.fontSize.xs,
  },
  empty: {
    fontSize: Typography.fontSize.base,
  },
});
