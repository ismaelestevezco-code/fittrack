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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { WeightChart } from '@/components/body/WeightChart';
import { EmptyState } from '@/components/common/EmptyState';
import { useBodyStore } from '@/stores/bodyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTierLimits } from '@/hooks/useTierLimits';
import { usePaywall } from '@/hooks/usePaywall';
import { useTheme } from '@/context/ThemeContext';
import { fromTimestamp } from '@/utils/dateUtils';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { BodyStackParamList } from '@/types/navigation.types';
import type { BodyWeightRow } from '@/types/database.types';

type Props = NativeStackScreenProps<BodyStackParamList, 'WeightHistory'>;

type Range = '1m' | '3m' | '6m' | 'all';
type ViewMode = 'daily' | 'weekly' | 'monthly';

const RANGES: Array<{ key: Range; label: string; days: number | null }> = [
  { key: '1m', label: '1 mes', days: 30 },
  { key: '3m', label: '3 meses', days: 90 },
  { key: '6m', label: '6 meses', days: 180 },
  { key: 'all', label: 'Todo', days: null },
];

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

export function WeightHistoryScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  const { allWeights, weightGoal, loadAllWeights, deleteWeight, isLoading } = useBodyStore();
  const { profile } = useProfileStore();
  const limits = useTierLimits();
  const { openPaywall } = usePaywall();

  const weighingMode = (profile?.weighing_mode ?? 'daily') as 'daily' | 'weekly' | 'monthly';

  const [range, setRange] = useState<Range>('3m');
  const [viewMode, setViewMode] = useState<ViewMode>(
    weighingMode === 'monthly' ? 'monthly' : 'daily',
  );
  const [listExpanded, setListExpanded] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<BodyWeightRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAllWeights();
  }, []);

  const rangeConfig = RANGES.find(r => r.key === range)!;

  // Limitar historial según tier: Free ve solo las últimas N semanas
  const tierCutoff = limits.weightHistoryWeeks === Infinity
    ? 0
    : Math.floor(Date.now() / 1000) - limits.weightHistoryWeeks * 7 * 86400;

  const filteredData = (() => {
    const byTier = tierCutoff > 0 ? allWeights.filter(w => w.date >= tierCutoff) : allWeights;
    return rangeConfig.days
      ? byTier.filter(w => w.date >= Math.floor(Date.now() / 1000) - rangeConfig.days! * 86400)
      : byTier;
  })();

  const sorted = [...filteredData].sort((a, b) => a.date - b.date);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteWeight(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleting, deleteWeight]);

  const formatDate = (ts: number) => {
    return fromTimestamp(ts).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading && allWeights.length === 0) {
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
        {/* Aviso de límite para Free */}
        {limits.weightHistoryWeeks !== Infinity && (
          <Pressable
            style={{ backgroundColor: `${colors.secondary}15`, borderRadius: 8, padding: 10, marginBottom: 4 }}
            onPress={() => openPaywall('plus')}
          >
            <Text style={{ color: colors.secondary, fontSize: 12, textAlign: 'center' }}>
              Mostrando las últimas {limits.weightHistoryWeeks} semanas · Toca para ver el historial completo con Plus
            </Text>
          </Pressable>
        )}

        {/* Range selector */}
        <View style={styles.rangeRow}>
          {RANGES.map(r => {
            const active = range === r.key;
            return (
              <Pressable
                key={r.key}
                style={[
                  styles.rangeBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setRange(r.key)}
              >
                <Text style={[
                  styles.rangeBtnText,
                  { color: colors.textSecondary },
                  active && { color: colors.background },
                ]}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* View mode tabs (not shown when profile is set to monthly-only) */}
        {weighingMode !== 'monthly' && (
          <View style={styles.viewModeRow}>
            {(['daily', 'weekly', 'monthly'] as ViewMode[]).map(vm => {
              const active = viewMode === vm;
              return (
                <Pressable
                  key={vm}
                  style={[
                    styles.viewModeBtn,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setViewMode(vm)}
                >
                  <Text style={[
                    styles.viewModeBtnText,
                    { color: active ? colors.background : colors.textSecondary },
                  ]}>
                    {VIEW_MODE_LABELS[vm]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <WeightChart
            data={sorted}
            height={220}
            goalWeight={weightGoal?.target_weight_kg}
            viewMode={viewMode}
          />
        </View>

        {sorted.length === 0 ? (
          <EmptyState
            icon="scale-bathroom"
            title="Sin registros"
            description="No hay registros de peso en el período seleccionado."
          />
        ) : (
          <>
            {/* Collapsible list header */}
            <Pressable
              style={[
                styles.listHeader,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setListExpanded(prev => !prev)}
            >
              <Text style={[styles.listHeaderText, { color: colors.textPrimary }]}>
                Registros ({sorted.length})
              </Text>
              <MaterialCommunityIcons
                name={listExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>

            {listExpanded && (
              <View style={[styles.list, { backgroundColor: colors.surface }]}>
                {[...sorted].reverse().map((record, index, arr) => {
                  const prev = arr[index + 1];
                  const delta = prev ? record.weight_kg - prev.weight_kg : null;
                  return (
                    <View key={record.id} style={[styles.row, { borderBottomColor: colors.border }]}>
                      <View style={styles.rowLeft}>
                        <Text style={[styles.rowDate, { color: colors.textPrimary }]}>{formatDate(record.date)}</Text>
                        {record.notes ? (
                          <Text style={[styles.rowNotes, { color: colors.textSecondary }]} numberOfLines={1}>
                            {record.notes}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.rowRight}>
                        <Text style={[styles.rowWeight, { color: colors.textPrimary }]}>{record.weight_kg.toFixed(1)} kg</Text>
                        {delta !== null && (
                          <View style={styles.deltaRow}>
                            <MaterialCommunityIcons
                              name={
                                delta > 0.05
                                  ? 'arrow-up'
                                  : delta < -0.05
                                  ? 'arrow-down'
                                  : 'minus'
                              }
                              size={10}
                              color={colors.textSecondary}
                            />
                            <Text style={[styles.deltaText, { color: colors.textSecondary }]}>{Math.abs(delta).toFixed(1)}</Text>
                          </View>
                        )}
                        <Pressable
                          onPress={() => setDeleteTarget(record)}
                          hitSlop={8}
                          style={styles.deleteBtn}
                        >
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={16}
                            color={colors.danger}
                          />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={deleteTarget !== null}
        title="¿Eliminar registro?"
        message={`Se eliminará el registro del ${deleteTarget ? formatDate(deleteTarget.date) : ''}.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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
  viewModeRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  viewModeBtn: {
    flex: 1,
    height: 32,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  chartCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  listHeaderText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  list: {
    borderRadius: Layout.cardRadius,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderBottomWidth: 0.5,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowDate: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  rowNotes: {
    fontSize: Typography.fontSize.xs,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  rowWeight: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deltaText: {
    fontSize: Typography.fontSize.xs,
  },
  deleteBtn: {
    padding: Spacing[1],
    marginLeft: Spacing[1],
  },
});
