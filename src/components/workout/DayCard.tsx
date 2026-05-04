import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import { formatDayShort } from '@/utils/dateUtils';
import type { RoutineDayRow, WorkoutSessionRow } from '@/types/database.types';

interface DayCardProps {
  day: RoutineDayRow;
  date: Date;
  session: WorkoutSessionRow | undefined;
  exerciseCount: number;
  onPress: () => void;
}

export function DayCard({ day, date, session, exerciseCount, onPress }: DayCardProps) {
  const { colors } = useTheme();
  const isCompleted = session?.finished_at != null;
  const isInProgress = session != null && session.finished_at == null;
  const isRestDay = day.is_rest_day === 1;
  const today = isSameDay(date, new Date());

  const bg = isCompleted
    ? `${colors.accent}0F`
    : isRestDay
      ? `${colors.textPrimary}08`
      : today
        ? `${colors.primary}14`
        : `${colors.textPrimary}0A`;

  const borderColor = isCompleted
    ? `${colors.accent}33`
    : isRestDay
      ? `${colors.textPrimary}0F`
      : today
        ? colors.borderStrong
        : `${colors.textPrimary}12`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: bg, borderColor },
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
    >
      {/* Accent line izquierda — flujo normal (evita bug de clipping en Android con position:absolute) */}
      {today && !isCompleted && (
        <View style={[styles.accentLine, { backgroundColor: colors.primary }]} />
      )}

      <View style={styles.innerContent}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={[styles.dateLabel, { color: isCompleted ? colors.accent : colors.textSecondary }]}>
              {formatDayShort(date)}
            </Text>
            <Text
              style={[
                styles.dayName,
                {
                  color: isCompleted
                    ? colors.accent
                    : isRestDay
                      ? colors.textSecondary
                      : colors.textPrimary,
                },
              ]}
              numberOfLines={1}
            >
              {day.name}
            </Text>
          </View>
          <StatusIcon
            isCompleted={isCompleted}
            isInProgress={isInProgress}
            isRestDay={isRestDay}
          />
        </View>

        {!isRestDay && (
          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="dumbbell"
              size={12}
              color={isCompleted ? colors.accent : colors.textHint}
            />
            <Text style={[styles.count, { color: isCompleted ? colors.accent : colors.textHint }]}>
              {exerciseCount === 0
                ? 'Sin ejercicios'
                : `${exerciseCount} ejercicio${exerciseCount !== 1 ? 's' : ''}`}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function StatusIcon({
  isCompleted,
  isInProgress,
  isRestDay,
}: {
  isCompleted: boolean;
  isInProgress: boolean;
  isRestDay: boolean;
}) {
  const { colors } = useTheme();

  if (isRestDay) {
    return (
      <View style={[styles.badge, { backgroundColor: `${colors.textPrimary}0D` }]}>
        <MaterialCommunityIcons name="sleep" size={14} color={colors.textHint} />
      </View>
    );
  }
  if (isCompleted) {
    return (
      <View style={[styles.badge, { backgroundColor: `${colors.accent}1A` }]}>
        <MaterialCommunityIcons name="check" size={14} color={colors.accent} />
      </View>
    );
  }
  if (isInProgress) {
    return (
      <View style={[styles.badge, { backgroundColor: `${colors.warning}1A` }]}>
        <MaterialCommunityIcons name="play" size={14} color={colors.warning} />
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: `${colors.textPrimary}0D` }]}>
      <MaterialCommunityIcons name="circle-outline" size={14} color={colors.textHint} />
    </View>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: Spacing[2],
    borderWidth: 0.5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentLine: {
    width: 3,
  },
  innerContent: {
    flex: 1,
    padding: Spacing[4],
  },
  containerPressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: Spacing[2],
  },
  dateLabel: {
    fontSize: Typography.fontSize.caption,
    marginBottom: 2,
    textTransform: 'capitalize',
    fontWeight: Typography.fontWeight.medium,
  },
  dayName: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[2],
  },
  count: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.medium,
  },
});
