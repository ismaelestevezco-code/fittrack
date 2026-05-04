import React, { useState, useCallback, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/common/NumberInput';
import { Input } from '@/components/common/Input';
import { useBodyStore } from '@/stores/bodyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/context/ThemeContext';
import { MIN_WEIGHT_KG, MAX_WEIGHT_KG } from '@/constants/config';
import { toDayTimestamp, fromTimestamp } from '@/utils/dateUtils';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { BodyStackParamList } from '@/types/navigation.types';

type Props = NativeStackScreenProps<BodyStackParamList, 'LogWeight'>;

// Returns the timestamp for the target day in a given month.
// dayValue: 0=primer día, -1=último día, 1-31=día concreto
function getMonthlyTargetTs(year: number, month: number, dayValue: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let day: number;
  if (dayValue === 0) day = 1;
  else if (dayValue === -1) day = daysInMonth;
  else day = Math.min(dayValue, daysInMonth);
  return toDayTimestamp(new Date(year, month, day));
}

// Returns the most recent allowed weighing day that is ≤ todayTs.
function getMostRecentAllowedDate(
  mode: 'daily' | 'weekly' | 'monthly',
  days: number[],
  todayTs: number,
): number {
  if (mode === 'daily' || days.length === 0) return todayTs;

  if (mode === 'weekly') {
    for (let i = 0; i < 7; i++) {
      const candidate = todayTs - i * 86400;
      const d = fromTimestamp(candidate);
      const dow = d.getDay() === 0 ? 7 : d.getDay();
      if (days.includes(dow)) return candidate;
    }
    return todayTs;
  }

  if (mode === 'monthly') {
    const dayValue = days[0]; // 0=first, -1=last, 1-31=custom
    const today = fromTimestamp(todayTs);
    // Try current month
    const thisMonthTs = getMonthlyTargetTs(today.getFullYear(), today.getMonth(), dayValue);
    if (thisMonthTs <= todayTs) return thisMonthTs;
    // Try previous month
    let prevMonth = today.getMonth() - 1;
    let prevYear = today.getFullYear();
    if (prevMonth < 0) { prevMonth = 11; prevYear--; }
    return getMonthlyTargetTs(prevYear, prevMonth, dayValue);
  }

  return todayTs;
}

export function LogWeightScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { recentWeights, logWeight } = useBodyStore();
  const { profile } = useProfileStore();

  const weighingMode = (profile?.weighing_mode ?? 'daily') as 'daily' | 'weekly' | 'monthly';
  const weighingDays: number[] = JSON.parse(profile?.weighing_days ?? '[]');

  const latestWeight =
    recentWeights.length > 0
      ? [...recentWeights].sort((a, b) => b.date - a.date)[0].weight_kg
      : 70;

  const todayTs = toDayTimestamp(new Date());
  const initialDate = getMostRecentAllowedDate(weighingMode, weighingDays, todayTs);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [weight, setWeight] = useState(latestWeight);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const existingRecord = recentWeights.find(w => w.date === selectedDate);

  useEffect(() => {
    if (existingRecord) {
      setWeight(existingRecord.weight_kg);
      setNotes(existingRecord.notes ?? '');
    }
  }, [selectedDate]);

  const handleDateChange = useCallback((direction: 1 | -1) => {
    setSelectedDate(prev => {
      if (weighingMode === 'daily' || weighingDays.length === 0) {
        const newDate = prev + direction * 86400;
        return newDate <= todayTs ? newDate : todayTs;
      }

      if (weighingMode === 'weekly') {
        // Search up to 7 days in the given direction for the next allowed day-of-week
        let candidate = prev + direction * 86400;
        for (let i = 0; i < 7; i++) {
          const d = fromTimestamp(candidate);
          const dow = d.getDay() === 0 ? 7 : d.getDay();
          if (weighingDays.includes(dow)) {
            return direction === 1 ? Math.min(candidate, todayTs) : candidate;
          }
          candidate += direction * 86400;
        }
        // Fallback: step by one day
        const fallback = prev + direction * 86400;
        return direction === 1 ? Math.min(fallback, todayTs) : fallback;
      }

      if (weighingMode === 'monthly') {
        const d = fromTimestamp(prev);
        let month = d.getMonth() + direction;
        let year = d.getFullYear();
        if (month > 11) { month = 0; year++; }
        if (month < 0) { month = 11; year--; }
        const dayValue = weighingDays.length > 0 ? weighingDays[0] : 0; // 0=first, -1=last, n=custom
        const targetTs = getMonthlyTargetTs(year, month, dayValue);
        return direction === 1 ? Math.min(targetTs, todayTs) : targetTs;
      }

      const newDate = prev + direction * 86400;
      return newDate <= todayTs ? newDate : todayTs;
    });
  }, [todayTs, weighingMode, weighingDays]);

  const formatDate = (ts: number) => {
    const d = fromTimestamp(ts);
    const todayMidnight = toDayTimestamp(new Date());
    const yesterdayMidnight = todayMidnight - 86400;
    if (ts === todayMidnight) return 'Hoy';
    if (ts === yesterdayMidnight) return 'Ayer';
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const handleSave = useCallback(async () => {
    if (saving) return;
    if (weight < MIN_WEIGHT_KG || weight > MAX_WEIGHT_KG) {
      setError(`El peso debe estar entre ${MIN_WEIGHT_KG} y ${MAX_WEIGHT_KG} kg`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    setError('');
    try {
      await logWeight({ weight_kg: weight, date: selectedDate, notes: notes.trim() || null });
      navigation.goBack();
    } catch {
      setError('Error al guardar. Inténtalo de nuevo.');
      setSaving(false);
    }
  }, [saving, weight, selectedDate, notes, logWeight, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.dateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Fecha</Text>
          <View style={styles.dateRow}>
            <Pressable
              style={styles.dateArrow}
              onPress={() => handleDateChange(-1 as const)}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.dateText, { color: colors.textPrimary }]}>{formatDate(selectedDate)}</Text>
            <Pressable
              style={[styles.dateArrow, selectedDate >= todayTs && styles.dateArrowDisabled]}
              onPress={() => handleDateChange(1 as const)}
              disabled={selectedDate >= todayTs}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={selectedDate >= todayTs ? colors.textHint : colors.textPrimary}
              />
            </Pressable>
          </View>
          {existingRecord && (
            <View style={[styles.existingBadge, { backgroundColor: `${colors.warning}1A` }]}>
              <MaterialCommunityIcons name="pencil" size={12} color={colors.warning} />
              <Text style={[styles.existingText, { color: colors.warning }]}>
                Actualizando registro del {formatDate(selectedDate)}
              </Text>
            </View>
          )}
        </View>

        <NumberInput
          label="Peso"
          value={weight}
          onChange={setWeight}
          min={MIN_WEIGHT_KG}
          max={MAX_WEIGHT_KG}
          step={0.01}
          decimals={2}
          unit="kg"
        />

        <Input
          label="Notas (opcional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Ej: En ayunas, después del desayuno..."
          multiline
        />

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          label={existingRecord ? 'Actualizar registro' : 'Guardar peso'}
          onPress={handleSave}
          loading={saving}
        />
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
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[3],
  },
  dateCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateArrow: {
    padding: Spacing[2],
  },
  dateArrowDisabled: {
    opacity: 0.4,
  },
  dateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  existingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Layout.borderRadius.full,
    alignSelf: 'flex-start',
  },
  existingText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  error: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderTopWidth: 0.5,
  },
});
