import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { ExerciseRow } from '@/types/database.types';

interface ExerciseItemProps {
  exercise: ExerciseRow;
  onPress?: (exerciseId: number) => void;
  onLongPress?: (exerciseId: number) => void;
  showChevron?: boolean;
  rightAction?: React.ReactNode;
  // Badge de progreso opcional
  badge?: 'pr' | 'improved' | 'same' | null;
  badgeText?: string;
  // Datos de la última sesión
  lastWeight?: number;
  isPR?: boolean;
}

export function ExerciseItem({
  exercise,
  onPress,
  onLongPress,
  showChevron = true,
  rightAction,
  badge,
  badgeText,
  lastWeight,
  isPR,
}: ExerciseItemProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => onPress?.(exercise.id), [exercise.id, onPress]);
  const handleLongPress = useCallback(() => onLongPress?.(exercise.id), [exercise.id, onLongPress]);

  const effectiveBadge = isPR ? 'pr' : badge;
  const badgeConfig = effectiveBadge
    ? {
        pr: { bg: `${colors.accent}1A`, color: colors.accent, text: badgeText ?? '↑ PR' },
        improved: { bg: `${colors.primary}1A`, color: colors.primary, text: badgeText ?? '+?' },
        same: { bg: `${colors.warning}1A`, color: colors.warning, text: 'Igual' },
      }[effectiveBadge]
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      <View style={styles.left}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={[styles.details, { color: colors.textSecondary }]}>
          {exercise.target_sets} × {exercise.target_reps > 0 ? `${exercise.target_reps} reps` : '— reps'}
          {exercise.target_weight_kg > 0 ? ` · ${exercise.target_weight_kg} kg` : ''}
        </Text>
        {lastWeight != null && lastWeight > 0 && (
          <Text style={[styles.lastWeight, { color: colors.textHint }]}>
            Última: {lastWeight} kg
          </Text>
        )}
        {exercise.notes && (
          <Text style={[styles.notes, { color: colors.textHint }]} numberOfLines={1}>
            {exercise.notes}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        {badgeConfig && (
          <View style={[styles.badge, { backgroundColor: badgeConfig.bg }]}>
            <Text style={[styles.badgeText, { color: badgeConfig.color }]}>
              {badgeConfig.text}
            </Text>
          </View>
        )}
        {rightAction ?? (showChevron && (
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textHint} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.exerciseCardHeight,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderBottomWidth: 0.5,
  },
  left: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: Typography.fontSize.bodyLg,
    fontWeight: Typography.fontWeight.medium,
  },
  details: {
    fontSize: Typography.fontSize.body,
  },
  notes: {
    fontSize: Typography.fontSize.caption,
    fontStyle: 'italic',
  },
  lastWeight: {
    fontSize: Typography.fontSize.caption,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginLeft: Spacing[2],
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
  },
});
