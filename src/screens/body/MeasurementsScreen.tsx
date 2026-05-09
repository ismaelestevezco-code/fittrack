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
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/common/NumberInput';
import { MeasurementRow } from '@/components/body/MeasurementRow';
import { PremiumGate } from '@/components/common/PremiumGate';
import { EmptyState } from '@/components/common/EmptyState';
import { useBodyStore } from '@/stores/bodyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/context/ThemeContext';
import { toDayTimestamp, fromTimestamp } from '@/utils/dateUtils';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { BodyStackParamList } from '@/types/navigation.types';
import type { UpsertMeasurementInput } from '@/repositories/BodyMeasurementRepository';

type Props = NativeStackScreenProps<BodyStackParamList, 'Measurements'>;

type MeasurementField =
  | 'chest_cm'
  | 'waist_cm'
  | 'hips_cm'
  | 'left_arm_cm'
  | 'right_arm_cm'
  | 'left_leg_cm'
  | 'right_leg_cm';

const FIELDS: Array<{ key: MeasurementField; label: string }> = [
  { key: 'chest_cm', label: 'Pecho' },
  { key: 'waist_cm', label: 'Cintura' },
  { key: 'hips_cm', label: 'Cadera' },
  { key: 'left_arm_cm', label: 'Brazo izq.' },
  { key: 'right_arm_cm', label: 'Brazo der.' },
  { key: 'left_leg_cm', label: 'Pierna izq.' },
  { key: 'right_leg_cm', label: 'Pierna der.' },
];

type FormValues = Record<MeasurementField, number>;
type FormEnabled = Record<MeasurementField, boolean>;

const DEFAULT_VALUES: FormValues = {
  chest_cm: 90,
  waist_cm: 80,
  hips_cm: 95,
  left_arm_cm: 35,
  right_arm_cm: 35,
  left_leg_cm: 55,
  right_leg_cm: 55,
};

const DISABLED_FORM: FormEnabled = {
  chest_cm: false,
  waist_cm: false,
  hips_cm: false,
  left_arm_cm: false,
  right_arm_cm: false,
  left_leg_cm: false,
  right_leg_cm: false,
};

// Returns Monday of the ISO week containing `date`
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay() === 0 ? 7 : d.getDay(); // 1=Mon … 7=Sun
  d.setDate(d.getDate() - (dow - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonth(date: Date): string {
  const result = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function formatWeek(date: Date): string {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const start = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  return `${start} – ${endStr}`;
}

export function MeasurementsScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  const { measurements, isLoading, loadMeasurements, saveMeasurement } = useBodyStore();
  const { profile } = useProfileStore();

  const isWeekly = (profile?.measurement_frequency ?? 'monthly') === 'weekly';

  // Selected period anchor: first day of the month (monthly) or Monday of the week (weekly)
  const [selectedPeriod, setSelectedPeriod] = useState<Date>(() =>
    isWeekly ? getWeekStart(new Date()) : getMonthStart(new Date()),
  );

  const [formValues, setFormValues] = useState<FormValues>({ ...DEFAULT_VALUES });
  const [formEnabled, setFormEnabled] = useState<FormEnabled>({ ...DISABLED_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMeasurements();
  }, []);

  // Re-anchor when the frequency setting changes
  useEffect(() => {
    setSelectedPeriod(isWeekly ? getWeekStart(new Date()) : getMonthStart(new Date()));
  }, [isWeekly]);

  const currentTs = toDayTimestamp(selectedPeriod);
  const todayPeriodTs = toDayTimestamp(
    isWeekly ? getWeekStart(new Date()) : getMonthStart(new Date()),
  );

  const existingRecord = measurements.find(m => m.date === currentTs);

  useEffect(() => {
    if (existingRecord) {
      const newEnabled: FormEnabled = { ...DISABLED_FORM };
      const newValues: FormValues = { ...DEFAULT_VALUES };
      FIELDS.forEach(f => {
        const val = existingRecord[f.key];
        if (val !== null && val !== undefined) {
          newEnabled[f.key] = true;
          newValues[f.key] = val;
        }
      });
      setFormEnabled(newEnabled);
      setFormValues(newValues);
    } else {
      setFormEnabled({ ...DISABLED_FORM });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTs, existingRecord?.id]);

  const handlePeriodChange = useCallback((delta: number) => {
    setSelectedPeriod(prev => {
      let next: Date;
      if (isWeekly) {
        next = new Date(prev);
        next.setDate(next.getDate() + delta * 7);
        const todayWeek = getWeekStart(new Date());
        return next > todayWeek ? todayWeek : next;
      } else {
        next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
        const todayMonth = getMonthStart(new Date());
        return next > todayMonth ? todayMonth : next;
      }
    });
  }, [isWeekly]);

  const toggleField = useCallback((key: MeasurementField) => {
    setFormEnabled(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    const hasAny = FIELDS.some(f => formEnabled[f.key]);
    if (!hasAny) {
      setError('Activa al menos una medida antes de guardar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const input: UpsertMeasurementInput = {
        date: currentTs,
        chest_cm: formEnabled.chest_cm ? formValues.chest_cm : null,
        waist_cm: formEnabled.waist_cm ? formValues.waist_cm : null,
        hips_cm: formEnabled.hips_cm ? formValues.hips_cm : null,
        left_arm_cm: formEnabled.left_arm_cm ? formValues.left_arm_cm : null,
        right_arm_cm: formEnabled.right_arm_cm ? formValues.right_arm_cm : null,
        left_leg_cm: formEnabled.left_leg_cm ? formValues.left_leg_cm : null,
        right_leg_cm: formEnabled.right_leg_cm ? formValues.right_leg_cm : null,
      };
      await saveMeasurement(input);
    } catch {
      setError('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [saving, formEnabled, formValues, currentTs, saveMeasurement]);

  if (isLoading && measurements.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const sorted = [...measurements].sort((a, b) => b.date - a.date);
  const historyItems = sorted.filter(m => m.date !== currentTs);

  const periodLabel = isWeekly
    ? formatWeek(selectedPeriod)
    : formatMonth(selectedPeriod);

  const periodSectionLabel = isWeekly ? 'Semana' : 'Mes';

  const updateBadgeText = isWeekly
    ? 'Actualizando medidas de esta semana'
    : 'Actualizando medidas del mes';

  const hintText = isWeekly
    ? 'Frecuencia: semanal (cámbiala en Ajustes)'
    : 'Frecuencia: mensual (cámbiala en Ajustes)';

  return (
    <PremiumGate requiredTier="plus" feature="Medidas corporales">
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Period selector */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{periodSectionLabel}</Text>
          <View style={styles.monthRow}>
            <Pressable onPress={() => handlePeriodChange(-1)} hitSlop={8} style={styles.arrow}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.monthText, { color: colors.textPrimary }]}>{periodLabel}</Text>
            <Pressable
              onPress={() => handlePeriodChange(1)}
              disabled={currentTs >= todayPeriodTs}
              hitSlop={8}
              style={[styles.arrow, currentTs >= todayPeriodTs && styles.arrowDisabled]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={currentTs >= todayPeriodTs ? colors.textHint : colors.textPrimary}
              />
            </Pressable>
          </View>
          {existingRecord && (
            <View style={[styles.existingBadge, { backgroundColor: `${colors.warning}1A` }]}>
              <MaterialCommunityIcons name="pencil" size={12} color={colors.warning} />
              <Text style={[styles.existingText, { color: colors.warning }]}>{updateBadgeText}</Text>
            </View>
          )}
          <Text style={[styles.hint, { color: colors.textHint }]}>{hintText}</Text>
        </View>

        {/* Measurement fields */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Medidas (cm) — selecciona las que quieras registrar
          </Text>
          {FIELDS.map(field => (
            <View key={field.key} style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => toggleField(field.key)} style={styles.fieldToggle}>
                <MaterialCommunityIcons
                  name={formEnabled[field.key] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={formEnabled[field.key] ? colors.primary : colors.textHint}
                />
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: formEnabled[field.key] ? colors.textPrimary : colors.textHint },
                  ]}
                >
                  {field.label}
                </Text>
                {!formEnabled[field.key] && (
                  <Text style={[styles.notSet, { color: colors.textHint }]}>No registrar</Text>
                )}
              </Pressable>
              {formEnabled[field.key] && (
                <View style={styles.fieldInput}>
                  <NumberInput
                    label={field.label}
                    value={formValues[field.key]}
                    onChange={v => setFormValues(prev => ({ ...prev, [field.key]: v }))}
                    min={20}
                    max={300}
                    step={0.5}
                    decimals={1}
                    unit="cm"
                  />
                </View>
              )}
            </View>
          ))}

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <Button
            label={existingRecord ? 'Actualizar medidas' : 'Guardar medidas'}
            onPress={handleSave}
            loading={saving}
          />
        </View>

        {historyItems.length > 0 && (
          <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>Historial</Text>
        )}
        {historyItems.length === 0 && measurements.length === 0 ? (
          <EmptyState
            icon="tape-measure"
            title="Sin historial"
            description="Los registros anteriores aparecerán aquí."
          />
        ) : (
          historyItems.map((record, i) => {
            const prev = historyItems[i + 1];
            const visibleFields = FIELDS.filter(f => record[f.key] !== null);
            if (visibleFields.length === 0) return null;
            const recordDate = fromTimestamp(record.date);
            const label = isWeekly ? formatWeek(recordDate) : formatMonth(recordDate);
            return (
              <View key={record.id} style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.historyMonth, { color: colors.textPrimary }]}>{label}</Text>
                {visibleFields.map(f => (
                  <MeasurementRow
                    key={f.key}
                    label={f.label}
                    value={record[f.key]}
                    previousValue={prev ? prev[f.key] : undefined}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
    </PremiumGate>
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: { padding: Spacing[2] },
  arrowDisabled: { opacity: 0.4 },
  monthText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
    textAlign: 'center',
  },
  existingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Layout.borderRadius.full,
    alignSelf: 'flex-start',
  },
  existingText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
  },
  fieldRow: {
    borderBottomWidth: 0.5,
    paddingBottom: Spacing[3],
  },
  fieldToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[1],
  },
  fieldLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  notSet: {
    fontSize: Typography.fontSize.xs,
  },
  fieldInput: {
    marginTop: Spacing[2],
  },
  error: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  historyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    paddingHorizontal: Spacing[1],
  },
  historyCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  historyMonth: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[2],
  },
});
