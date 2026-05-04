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
import { EmptyState } from '@/components/common/EmptyState';
import { useBodyStore } from '@/stores/bodyStore';
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

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonth(date: Date): string {
  const result = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function MeasurementsScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  const { measurements, isLoading, loadMeasurements, saveMeasurement } = useBodyStore();

  const [selectedMonth, setSelectedMonth] = useState(() => getMonthStart(new Date()));
  const [formValues, setFormValues] = useState<FormValues>({ ...DEFAULT_VALUES });
  const [formEnabled, setFormEnabled] = useState<FormEnabled>({
    chest_cm: false,
    waist_cm: false,
    hips_cm: false,
    left_arm_cm: false,
    right_arm_cm: false,
    left_leg_cm: false,
    right_leg_cm: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMeasurements();
  }, []);

  const currentMonthTs = toDayTimestamp(selectedMonth);
  const todayMonthTs = toDayTimestamp(getMonthStart(new Date()));

  const existingRecord = measurements.find(m => m.date === currentMonthTs);

  useEffect(() => {
    if (existingRecord) {
      const newEnabled: FormEnabled = { ...formEnabled };
      const newValues: FormValues = { ...formValues };
      FIELDS.forEach(f => {
        const val = existingRecord[f.key];
        if (val !== null && val !== undefined) {
          newEnabled[f.key] = true;
          newValues[f.key] = val;
        } else {
          newEnabled[f.key] = false;
        }
      });
      setFormEnabled(newEnabled);
      setFormValues(newValues);
    } else {
      setFormEnabled({
        chest_cm: false,
        waist_cm: false,
        hips_cm: false,
        left_arm_cm: false,
        right_arm_cm: false,
        left_leg_cm: false,
        right_leg_cm: false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonthTs, existingRecord?.id]);

  const handleMonthChange = useCallback((delta: number) => {
    setSelectedMonth(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      const todayMonth = getMonthStart(new Date());
      return next > todayMonth ? todayMonth : next;
    });
  }, []);

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
        date: currentMonthTs,
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
  }, [saving, formEnabled, formValues, currentMonthTs, saveMeasurement]);

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
  const historyItems = sorted.filter(m => m.date !== currentMonthTs);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Mes</Text>
          <View style={styles.monthRow}>
            <Pressable onPress={() => handleMonthChange(-1)} hitSlop={8} style={styles.arrow}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.monthText, { color: colors.textPrimary }]}>{formatMonth(selectedMonth)}</Text>
            <Pressable
              onPress={() => handleMonthChange(1)}
              disabled={currentMonthTs >= todayMonthTs}
              hitSlop={8}
              style={[styles.arrow, currentMonthTs >= todayMonthTs && styles.arrowDisabled]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={currentMonthTs >= todayMonthTs ? colors.textHint : colors.textPrimary}
              />
            </Pressable>
          </View>
          {existingRecord && (
            <View style={[styles.existingBadge, { backgroundColor: `${colors.warning}1A` }]}>
              <MaterialCommunityIcons name="pencil" size={12} color={colors.warning} />
              <Text style={[styles.existingText, { color: colors.warning }]}>Actualizando medidas del mes</Text>
            </View>
          )}
          <Text style={[styles.hint, { color: colors.textHint }]}>Recomendamos registrar una vez al mes</Text>
        </View>

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
            description="Los registros de meses anteriores aparecerán aquí."
          />
        ) : (
          historyItems.map((record, i) => {
            const prev = historyItems[i + 1];
            const visibleFields = FIELDS.filter(f => record[f.key] !== null);
            if (visibleFields.length === 0) return null;
            return (
              <View key={record.id} style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.historyMonth, { color: colors.textPrimary }]}>
                  {formatMonth(fromTimestamp(record.date))}
                </Text>
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
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
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
