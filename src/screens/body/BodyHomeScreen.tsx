import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WeightCard } from '@/components/body/WeightCard';
import { WeightChart } from '@/components/body/WeightChart';
import { PaceIndicator } from '@/components/body/PaceIndicator';
import { GoalProgressCard } from '@/components/body/GoalProgressCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useBodyStore } from '@/stores/bodyStore';
import { useBodyProgress } from '@/hooks/useBodyProgress';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { BodyStackParamList } from '@/types/navigation.types';

type NavProp = NativeStackNavigationProp<BodyStackParamList, 'BodyHome'>;

const QUICK_ACTIONS: Array<{
  key: keyof BodyStackParamList;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
}> = [
  { key: 'LogWeight', icon: 'plus-circle-outline', label: 'Registrar peso' },
  { key: 'WeightHistory', icon: 'history', label: 'Historial' },
  { key: 'Measurements', icon: 'tape-measure', label: 'Medidas' },
  { key: 'WeightGoal', icon: 'flag-variant-outline', label: 'Objetivo' },
];

export function BodyHomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { recentWeights, isLoading, loadBodyData } = useBodyStore();
  const progress = useBodyProgress();

  useEffect(() => {
    loadBodyData();
  }, []);

  const sortedRecent = [...recentWeights].sort((a, b) => a.date - b.date);
  const latestRecord = sortedRecent.length > 0 ? sortedRecent[sortedRecent.length - 1] : null;

  // Compute weekly average (Monday 00:00 to now)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayMidnight = new Date(now);
  mondayMidnight.setDate(now.getDate() - daysFromMonday);
  mondayMidnight.setHours(0, 0, 0, 0);
  const mondayTs = Math.floor(mondayMidnight.getTime() / 1000);
  const thisWeekWeights = recentWeights.filter(w => w.date >= mondayTs);
  const weeklyAvg =
    thisWeekWeights.length > 0
      ? thisWeekWeights.reduce((s, w) => s + w.weight_kg, 0) / thisWeekWeights.length
      : null;

  if (isLoading && recentWeights.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <WeightCard
          currentWeight={progress.currentWeight}
          goalWeight={progress.goalWeight}
          lastRecordedDate={latestRecord?.date ?? null}
        />

        <GoalProgressCard
          currentWeight={progress.currentWeight}
          initialWeight={progress.initialWeight}
          goalWeight={progress.goalWeight}
          progressPercent={progress.progressPercent}
        />

        {progress.goalWeight !== null && (
          <PaceIndicator
            weeklyRate={progress.weeklyRate}
            requiredRate={progress.requiredRate}
            daysUntilGoal={progress.daysUntilGoal}
          />
        )}

        <View style={[styles.weeklyAvgCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="calendar-week" size={18} color={colors.textSecondary} />
          <Text style={[styles.weeklyAvgLabel, { color: colors.textSecondary }]}>Media semanal</Text>
          <Text style={[styles.weeklyAvgValue, { color: colors.textPrimary }]}>
            {weeklyAvg !== null ? `${weeklyAvg.toFixed(2)} kg` : '— kg'}
          </Text>
          {thisWeekWeights.length > 0 && (
            <Text style={[styles.weeklyAvgCount, { color: colors.textHint }]}>
              {thisWeekWeights.length} {thisWeekWeights.length === 1 ? 'registro' : 'registros'}
            </Text>
          )}
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>Evolución del peso</Text>
          {sortedRecent.length < 2 ? (
            <EmptyState
              icon="chart-line"
              title="Sin datos suficientes"
              description="Registra al menos 2 pesos para ver la gráfica."
            />
          ) : (
            <WeightChart
              data={sortedRecent}
              height={200}
              goalWeight={progress.goalWeight}
            />
          )}
        </View>

        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <Pressable
              key={action.key}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate(action.key as never)}
            >
              <MaterialCommunityIcons name={action.icon} size={26} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{action.label}</Text>
            </Pressable>
          ))}
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
  weeklyAvgCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  weeklyAvgLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  weeklyAvgValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  weeklyAvgCount: {
    fontSize: Typography.fontSize.xs,
  },
  chartCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  chartTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    alignItems: 'center',
    gap: Spacing[2],
  },
  actionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
});
