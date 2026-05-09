import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { NumberInput } from '@/components/common/NumberInput';
import { useBodyStore } from '@/stores/bodyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { BodyStackParamList } from '@/types/navigation.types';

type Props = NativeStackScreenProps<BodyStackParamList, 'WeightGoal'>;

function getMonthFirst(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatTargetMonth(date: Date): string {
  const result = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function WeightGoalScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { weightGoal, recentWeights, setWeightGoal, clearWeightGoal } = useBodyStore();
  const { profile } = useProfileStore();

  const currentWeight = useMemo(() => {
    if (recentWeights.length > 0) {
      return [...recentWeights].sort((a, b) => b.date - a.date)[0].weight_kg;
    }
    return profile?.initial_weight_kg ?? 70;
  }, [recentWeights, profile]);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return getMonthFirst(d);
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return getMonthFirst(d);
  }, []);

  const initialTargetDate = useMemo(() => {
    if (weightGoal) {
      const d = new Date(weightGoal.target_date * 1000);
      const monthFirst = getMonthFirst(d);
      if (monthFirst < minDate) return new Date(minDate);
      if (monthFirst > maxDate) return new Date(maxDate);
      return monthFirst;
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    const monthFirst = getMonthFirst(d);
    return monthFirst < minDate ? new Date(minDate) : monthFirst;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [isLoading, setIsLoading] = useState(true);
  const [targetWeight, setTargetWeight] = useState(
    weightGoal?.target_weight_kg ?? Math.max(currentWeight - 5, 40),
  );
  const [targetDate, setTargetDate] = useState(initialTargetDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleDateChange = useCallback(
    (delta: number) => {
      setTargetDate(prev => {
        const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
        if (next < minDate) return new Date(minDate);
        if (next > maxDate) return new Date(maxDate);
        return next;
      });
    },
    [minDate, maxDate],
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilGoal = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 86400));
  const weeksUntilGoal = daysUntilGoal / 7;
  const weightDiff = targetWeight - currentWeight;
  const requiredRate = weeksUntilGoal > 0 ? weightDiff / weeksUntilGoal : 0;

  const isHealthy =
    Math.abs(requiredRate) < 0.05 ||
    (weightDiff < 0 ? requiredRate >= -0.75 : requiredRate <= 0.5);

  const atMin =
    targetDate.getFullYear() === minDate.getFullYear() &&
    targetDate.getMonth() === minDate.getMonth();
  const atMax =
    targetDate.getFullYear() === maxDate.getFullYear() &&
    targetDate.getMonth() === maxDate.getMonth();

  const handleSave = useCallback(async () => {
    if (saving) return;
    if (targetWeight < 30 || targetWeight > 300) {
      setError('El peso objetivo debe estar entre 30 y 300 kg');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setWeightGoal({
        target_weight_kg: targetWeight,
        target_date: Math.floor(targetDate.getTime() / 1000),
      });
      navigation.goBack();
    } catch {
      setError('Error al guardar. Inténtalo de nuevo.');
      setSaving(false);
    }
  }, [saving, targetWeight, targetDate, setWeightGoal, navigation]);

  const handleClear = useCallback(async () => {
    await clearWeightGoal();
    navigation.goBack();
  }, [clearWeightGoal, navigation]);

  const rateColor = isHealthy ? colors.accent : colors.warning;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <NumberInput
          label="Peso objetivo"
          value={targetWeight}
          onChange={setTargetWeight}
          min={30}
          max={300}
          step={0.5}
          decimals={1}
          unit="kg"
        />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Fecha límite</Text>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => handleDateChange(-1)}
              disabled={atMin}
              hitSlop={8}
              style={[styles.arrow, atMin && styles.arrowDisabled]}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={atMin ? colors.textHint : colors.textPrimary}
              />
            </Pressable>
            <Text style={[styles.dateText, { color: colors.textPrimary }]}>{formatTargetMonth(targetDate)}</Text>
            <Pressable
              onPress={() => handleDateChange(1)}
              disabled={atMax}
              hitSlop={8}
              style={[styles.arrow, atMax && styles.arrowDisabled]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={atMax ? colors.textHint : colors.textPrimary}
              />
            </Pressable>
          </View>
          <Text style={[styles.weeksText, { color: colors.textSecondary }]}>
            {daysUntilGoal > 0
              ? `${Math.round(weeksUntilGoal)} semanas desde hoy`
              : 'Fecha inválida'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Ritmo necesario</Text>
          <View style={styles.rateRow}>
            <MaterialCommunityIcons
              name={isHealthy ? 'check-circle' : 'alert-circle'}
              size={22}
              color={rateColor}
            />
            <Text style={[styles.rateValue, { color: rateColor }]}>
              {requiredRate >= 0 ? '+' : ''}
              {requiredRate.toFixed(2)} kg/semana
            </Text>
          </View>
          <Text style={[styles.rateDesc, { color: colors.textSecondary }]}>
            {isHealthy
              ? 'Este ritmo es saludable y alcanzable.'
              : weightDiff < 0
              ? 'Pérdida superior a 0.75 kg/semana — considera ampliar el plazo.'
              : 'Ganancia superior a 0.5 kg/semana — considera ampliar el plazo.'}
          </Text>
        </View>

        <View style={[styles.referenceCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.referenceTitle, { color: colors.textSecondary }]}>Referencia actual</Text>
          <View style={styles.referenceRow}>
            <Text style={[styles.referenceLabel, { color: colors.textSecondary }]}>Peso actual</Text>
            <Text style={[styles.referenceValue, { color: colors.textPrimary }]}>{currentWeight.toFixed(1)} kg</Text>
          </View>
          <View style={styles.referenceRow}>
            <Text style={[styles.referenceLabel, { color: colors.textSecondary }]}>Diferencia</Text>
            <Text
              style={[
                styles.referenceValue,
                { color: weightDiff > 0 ? colors.accent : colors.danger },
              ]}
            >
              {weightDiff >= 0 ? '+' : ''}
              {weightDiff.toFixed(1)} kg
            </Text>
          </View>
        </View>

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        {weightGoal !== null && (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
            <Text style={[styles.clearText, { color: colors.danger }]}>Eliminar objetivo</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button label="Guardar objetivo" onPress={handleSave} loading={saving} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[4],
    gap: Spacing[4],
  },
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: { padding: Spacing[2] },
  arrowDisabled: { opacity: 0.4 },
  dateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  weeksText: {
    fontSize: Typography.fontSize.sm,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  rateValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
  rateDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  referenceCard: {
    borderRadius: Layout.borderRadius.md,
    borderWidth: 0.5,
    padding: Spacing[3],
    gap: Spacing[2],
  },
  referenceTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  referenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: Typography.fontSize.sm,
  },
  referenceValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  error: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
  },
  clearText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderTopWidth: 0.5,
  },
});
