import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '@/components/common/EmptyState';
import { setLogRepository } from '@/repositories/SetLogRepository';
import { workoutSessionRepository } from '@/repositories/WorkoutSessionRepository';
import { calculateWeeklyData } from '@/logic/progressCalculator';
import type { WeekData } from '@/logic/progressCalculator';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import { useTierLimits } from '@/hooks/useTierLimits';
import { usePaywall } from '@/hooks/usePaywall';
import type { WorkoutStackParamList } from '@/types/navigation.types';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'WeekComparison'>;

type Range = 4 | 8 | 12;
const RANGES: Range[] = [4, 8, 12];

export function WeekComparisonScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  const limits = useTierLimits();
  const { openPaywall } = usePaywall();
  const availableRanges = limits.comparisonWeeks as Range[];
  const [range, setRange] = useState<Range>(availableRanges[0] ?? 4);
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [barWidth, setBarWidth] = useState(0);

  const load = useCallback(async (weeks: Range) => {
    setIsLoading(true);
    try {
      const sessions = await workoutSessionRepository.getRecentFinished(weeks * 7);
      const sessionIds = sessions.map(s => s.id);
      const setLogs = await setLogRepository.getBySessionIds(sessionIds);
      const data = calculateWeeklyData(sessions, setLogs);
      setWeekData(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const handleRangeChange = useCallback((r: Range) => {
    setRange(r);
  }, []);

  const RangeSelector = () => (
    <View style={styles.rangeRow}>
      {RANGES.map(r => {
        const active = range === r;
        const isLocked = !availableRanges.includes(r);
        return (
          <Pressable
            key={r}
            style={[
              styles.rangeBtn,
              { borderColor: colors.border, backgroundColor: colors.surface },
              active && !isLocked && { backgroundColor: colors.primary, borderColor: colors.primary },
              isLocked && { opacity: 0.5 },
            ]}
            onPress={() => isLocked ? openPaywall('plus') : handleRangeChange(r)}
          >
            <Text style={[
              styles.rangeBtnText,
              { color: colors.textSecondary },
              active && !isLocked && { color: colors.background },
            ]}>
              {r} sem.
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (weekData.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <RangeSelector />
        <EmptyState
          icon="chart-bar"
          title="Sin datos"
          description="Completa al menos una semana de entrenamientos para ver la comparativa."
        />
      </SafeAreaView>
    );
  }

  const maxVolume = Math.max(...weekData.map(w => w.totalVolumeKg), 1);
  const BAR_H = 120;
  const BAR_PAD = { top: 8, bottom: 20, left: 4, right: 4 };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <RangeSelector />

        <View
          style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border, height: BAR_H + BAR_PAD.top + BAR_PAD.bottom + 8 }]}
          onLayout={e => setBarWidth(e.nativeEvent.layout.width - Spacing[4] * 2)}
        >
          {barWidth > 0 && (
            <Svg width={barWidth} height={BAR_H + BAR_PAD.top + BAR_PAD.bottom}>
              <G transform={`translate(${BAR_PAD.left}, ${BAR_PAD.top})`}>
                {weekData.map((week, i) => {
                  const slotW = (barWidth - BAR_PAD.left - BAR_PAD.right) / weekData.length;
                  const barActualW = Math.max(slotW * 0.6, 4);
                  const x = i * slotW + (slotW - barActualW) / 2;
                  const barH = week.totalVolumeKg > 0
                    ? Math.max(4, (week.totalVolumeKg / maxVolume) * BAR_H)
                    : 2;
                  const y = BAR_H - barH;
                  return (
                    <G key={`${week.year}-${week.weekNumber}`}>
                      <Rect
                        x={x}
                        y={y}
                        width={barActualW}
                        height={barH}
                        rx={3}
                        fill={colors.primary}
                        opacity={0.85}
                      />
                      <SvgText
                        x={x + barActualW / 2}
                        y={BAR_H + 14}
                        fontSize={9}
                        fill={colors.textSecondary}
                        textAnchor="middle"
                      >
                        {`S${week.weekNumber}`}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>
          )}
        </View>

        {weekData.length > 0 && (() => {
          const avgVol = weekData.reduce((s, w) => s + w.totalVolumeKg, 0) / weekData.length;
          const avgSessions = weekData.reduce((s, w) => s + w.sessionsCompleted, 0) / weekData.length;
          const best = weekData.reduce((b, w) => w.totalVolumeKg > b.totalVolumeKg ? w : b);
          return (
            <View style={[styles.summaryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{avgVol.toFixed(0)}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>kg/sem prom.</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{avgSessions.toFixed(1)}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>ses/sem prom.</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{best.totalVolumeKg.toFixed(0)}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>mejor semana</Text>
              </View>
            </View>
          );
        })()}

        <View style={[styles.table, { backgroundColor: colors.surface }]}>
          <View style={[styles.tableRow, { borderBottomColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.tableCell, styles.tableCellWide, styles.tableHeaderText, { color: colors.textSecondary }]}>
              Semana
            </Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, { color: colors.textSecondary }]}>Ses.</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, { color: colors.textSecondary }]}>Volumen</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, { color: colors.textSecondary }]}>Delta</Text>
          </View>
          {[...weekData].reverse().map((week, i, arr) => {
            const prev = arr[i + 1];
            const delta = prev ? week.totalVolumeKg - prev.totalVolumeKg : null;
            const isUp = delta !== null && delta > 0;
            const isDown = delta !== null && delta < 0;
            return (
              <View
                key={`${week.year}-${week.weekNumber}`}
                style={[
                  styles.tableRow,
                  { borderBottomColor: colors.border },
                  i === 0 && { backgroundColor: `${colors.primary}12` },
                ]}
              >
                <Text style={[styles.tableCell, styles.tableCellWide, { color: colors.textPrimary }]}>
                  {`Sem. ${week.weekNumber}`}
                  <Text style={{ color: colors.textHint }}>{` '${String(week.year).slice(2)}`}</Text>
                </Text>
                <Text style={[styles.tableCell, { color: colors.textPrimary }]}>
                  {week.sessionsCompleted}
                </Text>
                <Text style={[styles.tableCell, { color: colors.textPrimary }]}>
                  {week.totalVolumeKg >= 1000
                    ? `${(week.totalVolumeKg / 1000).toFixed(1)}t`
                    : `${week.totalVolumeKg.toFixed(0)} kg`}
                </Text>
                <Text style={[
                  styles.tableCell,
                  { color: isUp ? colors.accent : isDown ? colors.danger : colors.textPrimary },
                  (isUp || isDown) && styles.deltaBold,
                ]}>
                  {delta === null
                    ? '—'
                    : `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}`}
                </Text>
              </View>
            );
          })}
        </View>
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
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  rangeBtn: {
    flex: 1,
    height: 36,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  chartCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 0.5,
    height: 36,
    alignSelf: 'center',
  },
  table: {
    borderRadius: Layout.cardRadius,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  tableHeaderText: {
    fontWeight: Typography.fontWeight.semibold,
  },
  tableCell: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    textAlign: 'right',
  },
  tableCellWide: {
    flex: 2,
    textAlign: 'left',
  },
  deltaBold: {
    fontWeight: Typography.fontWeight.medium,
  },
});
