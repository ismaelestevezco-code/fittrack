import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { Gradients, Spacing, Typography } from '@/constants/theme';
import { formatWeekLabel, getWeekStart } from '@/utils/dateUtils';

interface WeekSelectorProps {
  weekOffset: number;
  onOffsetChange: (offset: number) => void;
}

export function WeekSelector({ weekOffset, onOffsetChange }: WeekSelectorProps) {
  const { colors, isDark } = useTheme();
  const weekStart = getWeekStart(weekOffset);
  const label = formatWeekLabel(weekStart);
  const isCurrentWeek = weekOffset === 0;
  const isFutureWeek = weekOffset > 0;

  const handlePrev = useCallback(() => onOffsetChange(weekOffset - 1), [weekOffset, onOffsetChange]);
  const handleNext = useCallback(() => {
    if (!isFutureWeek) onOffsetChange(weekOffset + 1);
  }, [weekOffset, isFutureWeek, onOffsetChange]);
  const handleReset = useCallback(() => {
    if (weekOffset !== 0) onOffsetChange(0);
  }, [weekOffset, onOffsetChange]);

  const gradColors = isDark ? Gradients.primary.dark : Gradients.primary.light;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Pressable
          style={[styles.arrow, { backgroundColor: colors.surface }]}
          onPress={handlePrev}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="chevron-left" size={16} color={colors.primary} />
        </Pressable>

        <Pressable style={styles.label} onPress={handleReset} hitSlop={4}>
          <Text style={[styles.weekText, { color: colors.textSecondary }]}>{label}</Text>
          {!isCurrentWeek && (
            <Text style={[styles.backHint, { color: colors.primary }]}>Toca para volver</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.arrow, { backgroundColor: colors.surface }, isFutureWeek && styles.arrowDisabled]}
          onPress={handleNext}
          hitSlop={8}
          disabled={isFutureWeek}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={isFutureWeek ? colors.textHint : colors.primary}
          />
        </Pressable>
      </View>

      {/* Línea accent debajo */}
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentLine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing[4],
    gap: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
  },
  arrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  label: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  weekText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  backHint: {
    fontSize: 10,
  },
  accentLine: {
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
    marginTop: 2,
  },
});
