import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/context/ThemeContext';
import { clearAllData } from '@/database/database';
import type { ProfileStackParamList } from '@/types/navigation.types';
import { routineRepository } from '@/repositories/RoutineRepository';
import { exerciseRepository } from '@/repositories/ExerciseRepository';
import { workoutSessionRepository } from '@/repositories/WorkoutSessionRepository';
import { setLogRepository } from '@/repositories/SetLogRepository';
import { bodyWeightRepository } from '@/repositories/BodyWeightRepository';
import { bodyMeasurementRepository } from '@/repositories/BodyMeasurementRepository';
import { weightGoalRepository } from '@/repositories/WeightGoalRepository';
import { weeklyPlanRepository } from '@/repositories/WeeklyPlanRepository';
import { APP_VERSION } from '@/constants/config';
import { Layout, Spacing, Typography } from '@/constants/theme';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

export function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { profile, updateProfile, loadProfile } = useProfileStore();

  const [showResetConfirm1, setShowResetConfirm1] = useState(false);
  const [showResetConfirm2, setShowResetConfirm2] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isImperial = profile?.units === 'imperial';

  const weighingMode = (profile?.weighing_mode ?? 'daily') as 'daily' | 'weekly' | 'monthly';
  const weighingDays: number[] = JSON.parse(profile?.weighing_days ?? '[]');

  const WEEK_DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const WEEK_DAY_VALUES = [1, 2, 3, 4, 5, 6, 7];

  // Monthly day: 0 = primer día, -1 = último día, 1-31 = personalizado
  const monthlyDayValue = weighingDays.length > 0 ? weighingDays[0] : 0;
  const monthlyOption: 'first' | 'last' | 'custom' =
    monthlyDayValue === 0 ? 'first' : monthlyDayValue === -1 ? 'last' : 'custom';
  const customDayNumeric = monthlyDayValue >= 1 ? monthlyDayValue : 15;
  const [customDayText, setCustomDayText] = useState(String(customDayNumeric));

  async function handleWeighingModeChange(mode: 'daily' | 'weekly' | 'monthly') {
    if (!profile) return;
    let days: number[] = [];
    if (mode === 'monthly') days = [0]; // default: primer día del mes
    await updateProfile({ weighing_mode: mode, weighing_days: JSON.stringify(days) });
  }

  async function handleToggleWeekDay(day: number) {
    if (!profile) return;
    const current = new Set(weighingDays);
    if (current.has(day)) {
      current.delete(day);
    } else {
      current.add(day);
    }
    const sorted = Array.from(current).sort((a, b) => a - b);
    await updateProfile({ weighing_days: JSON.stringify(sorted) });
  }

  async function handleSelectMonthlyOption(option: 'first' | 'last' | 'custom') {
    if (!profile) return;
    if (option === 'first') {
      await updateProfile({ weighing_days: JSON.stringify([0]) });
    } else if (option === 'last') {
      await updateProfile({ weighing_days: JSON.stringify([-1]) });
    } else {
      const day = Math.min(31, Math.max(1, customDayNumeric));
      await updateProfile({ weighing_days: JSON.stringify([day]) });
    }
  }

  async function handleCustomDayChange(delta: number) {
    if (!profile) return;
    const next = Math.min(31, Math.max(1, customDayNumeric + delta));
    setCustomDayText(String(next));
    await updateProfile({ weighing_days: JSON.stringify([next]) });
  }

  async function handleCustomDayTextChange(text: string) {
    setCustomDayText(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 31 && profile) {
      await updateProfile({ weighing_days: JSON.stringify([parsed]) });
    }
  }

  async function handleCustomDayBlur() {
    if (!profile) return;
    const parsed = parseInt(customDayText, 10);
    const clamped = isNaN(parsed) ? 1 : Math.min(31, Math.max(1, parsed));
    setCustomDayText(String(clamped));
    await updateProfile({ weighing_days: JSON.stringify([clamped]) });
  }

  async function handleToggleUnits() {
    if (!profile) return;
    await updateProfile({ units: isImperial ? 'metric' : 'imperial' });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const [
        routines,
        routineDays,
        exercises,
        sessions,
        setLogs,
        weights,
        measurements,
        weightGoal,
        weeklyPlans,
      ] = await Promise.all([
        routineRepository.getAll(),
        routineRepository.getAllDays(),
        exerciseRepository.getAll(),
        workoutSessionRepository.getAll(),
        setLogRepository.getAll(),
        bodyWeightRepository.getAll(),
        bodyMeasurementRepository.getAll(),
        weightGoalRepository.get(),
        weeklyPlanRepository.getAll(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        profile,
        routines,
        routineDays,
        exercises,
        workoutSessions: sessions,
        setLogs,
        bodyWeights: weights,
        bodyMeasurements: measurements,
        weightGoal,
        weeklyPlans,
      };

      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: `FitTrack_export_${new Date().toISOString().split('T')[0]}.json`,
      });
    } catch {
      Alert.alert('Error', 'No se pudieron exportar los datos.');
    } finally {
      setExporting(false);
    }
  }

  function handleResetPress() {
    setShowResetConfirm1(true);
  }

  function handleConfirm1() {
    setShowResetConfirm1(false);
    setShowResetConfirm2(true);
  }

  async function handleConfirm2() {
    setShowResetConfirm2(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setResetting(true);
    try {
      await clearAllData();
      await loadProfile();
    } catch {
      Alert.alert('Error', 'No se pudieron eliminar los datos.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        {/* Cuerpo */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Cuerpo</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.row, { minHeight: undefined, paddingVertical: Spacing[3] }]}>
              <View style={styles.rowContent}>
                <MaterialCommunityIcons name="scale-bathroom" size={20} color={colors.textSecondary} />
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Frecuencia de pesaje</Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: Spacing[4], paddingBottom: Spacing[3], gap: Spacing[3] }}>
              {/* Mode selector buttons */}
              <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
                {(['daily', 'weekly', 'monthly'] as const).map(mode => {
                  const labels = { daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual' };
                  const active = weighingMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: Layout.borderRadius.md,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => handleWeighingModeChange(mode)}
                    >
                      <Text style={{
                        fontSize: Typography.fontSize.sm,
                        fontWeight: Typography.fontWeight.medium,
                        color: active ? colors.background : colors.textSecondary,
                      }}>
                        {labels[mode]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Weekly day toggles */}
              {weighingMode === 'weekly' && (
                <View style={{ flexDirection: 'row', gap: Spacing[1], justifyContent: 'space-between' }}>
                  {WEEK_DAY_VALUES.map((day, idx) => {
                    const active = weighingDays.includes(day);
                    return (
                      <Pressable
                        key={day}
                        onPress={() => handleToggleWeekDay(day)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primary : colors.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{
                          fontSize: Typography.fontSize.sm,
                          fontWeight: Typography.fontWeight.semibold,
                          color: active ? colors.background : colors.textSecondary,
                        }}>
                          {WEEK_DAY_LABELS[idx]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Monthly day selector */}
              {weighingMode === 'monthly' && (
                <View style={{ gap: Spacing[2] }}>
                  {/* 3 option buttons */}
                  <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
                    {([
                      { key: 'first' as const, label: 'Primer día' },
                      { key: 'last' as const, label: 'Último día' },
                      { key: 'custom' as const, label: 'Personalizado' },
                    ]).map(opt => {
                      const active = monthlyOption === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => handleSelectMonthlyOption(opt.key)}
                          style={{
                            flex: 1,
                            height: 34,
                            borderRadius: Layout.borderRadius.md,
                            borderWidth: 1,
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? colors.primary : colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{
                            fontSize: Typography.fontSize.xs,
                            fontWeight: Typography.fontWeight.medium,
                            color: active ? colors.background : colors.textSecondary,
                          }}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Custom day number control */}
                  {monthlyOption === 'custom' && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: Layout.borderRadius.md,
                      borderWidth: 1,
                      borderColor: colors.borderStrong,
                      backgroundColor: colors.surfaceElevated,
                      overflow: 'hidden',
                    }}>
                      <Pressable
                        onPress={() => handleCustomDayChange(-1)}
                        disabled={customDayNumeric <= 1}
                        style={({ pressed }) => ({
                          width: 44,
                          height: 44,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: pressed ? `${colors.primary}1F` : `${colors.primary}0F`,
                        })}
                      >
                        <Text style={{
                          fontSize: Typography.fontSize.xl,
                          fontWeight: Typography.fontWeight.regular,
                          lineHeight: 28,
                          color: customDayNumeric <= 1 ? colors.textHint : colors.primary,
                        }}>−</Text>
                      </Pressable>

                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[1] }}>
                        <TextInput
                          value={customDayText}
                          onChangeText={handleCustomDayTextChange}
                          onBlur={handleCustomDayBlur}
                          keyboardType="number-pad"
                          returnKeyType="done"
                          selectTextOnFocus
                          textAlign="center"
                          style={{
                            fontSize: Typography.fontSize.md,
                            fontWeight: Typography.fontWeight.semibold,
                            color: colors.textPrimary,
                            minWidth: 48,
                            padding: 0,
                          }}
                        />
                        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textHint }}>
                          de cada mes
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => handleCustomDayChange(1)}
                        disabled={customDayNumeric >= 31}
                        style={({ pressed }) => ({
                          width: 44,
                          height: 44,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: pressed ? `${colors.primary}1F` : `${colors.primary}0F`,
                        })}
                      >
                        <Text style={{
                          fontSize: Typography.fontSize.xl,
                          fontWeight: Typography.fontWeight.regular,
                          lineHeight: 28,
                          color: customDayNumeric >= 31 ? colors.textHint : colors.primary,
                        }}>+</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Explanation text */}
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textHint, textAlign: 'center' }}>
                    {monthlyOption === 'first' && 'Se pesará el día 1 de cada mes'}
                    {monthlyOption === 'last' && 'Se pesará el último día de cada mes (adaptado a cada mes)'}
                    {monthlyOption === 'custom' && `Se pesará el día ${customDayNumeric} de cada mes (o el último si el mes es más corto)`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Unidades */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Unidades</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable style={styles.row} onPress={handleToggleUnits}>
              <View style={styles.rowContent}>
                <MaterialCommunityIcons name="ruler" size={20} color={colors.textSecondary} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Sistema de medidas</Text>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{isImperial ? 'Imperial (lb, pulgadas)' : 'Métrico (kg, cm)'}</Text>
                </View>
              </View>
              <View style={[styles.toggle, { backgroundColor: isImperial ? colors.primary : colors.border }]}>
                <View style={[styles.toggleThumb, isImperial && styles.toggleThumbActive, { backgroundColor: colors.surface }]} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Preferencias */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferencias</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable style={styles.row} onPress={() => navigation.navigate('EditPreferences')}>
              <View style={styles.rowContent}>
                <MaterialCommunityIcons name="tune-variant" size={20} color={colors.textSecondary} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Cambiar preferencias</Text>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>Objetivo, nivel, días y equipamiento</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.row} onPress={toggleTheme}>
              <View style={styles.rowContent}>
                <MaterialCommunityIcons
                  name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
                  size={20}
                  color={colors.textSecondary}
                />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Tema</Text>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{isDark ? 'Oscuro' : 'Claro'}</Text>
                </View>
              </View>
              <View style={[styles.toggle, { backgroundColor: isDark ? colors.primary : colors.border }]}>
                <View style={[styles.toggleThumb, isDark && styles.toggleThumbActive, { backgroundColor: colors.surface }]} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Datos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Datos</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable style={styles.row} onPress={handleExport} disabled={exporting}>
              <View style={styles.rowContent}>
                <MaterialCommunityIcons name="export" size={20} color={colors.textSecondary} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Exportar datos</Text>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>Genera un archivo JSON con toda tu información</Text>
                </View>
              </View>
              {exporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
              )}
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.row} onPress={handleResetPress} disabled={resetting}>
              <View style={styles.rowContent}>
                <MaterialCommunityIcons name="delete-outline" size={20} color={colors.danger} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.danger }]}>Resetear todos los datos</Text>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>Elimina permanentemente toda tu información</Text>
                </View>
              </View>
              {resetting ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Información</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <MaterialCommunityIcons name="information-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Versión</Text>
              </View>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{APP_VERSION}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <MaterialCommunityIcons name="wifi-off" size={20} color={colors.textSecondary} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Modo offline</Text>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>Todos los datos se guardan en el dispositivo</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showResetConfirm1}
        title="¿Resetear todos los datos?"
        message="Esta acción eliminará permanentemente todos tus entrenamientos, registros de peso, medidas y configuración. No se puede deshacer."
        confirmLabel="Sí, continuar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleConfirm1}
        onCancel={() => setShowResetConfirm1(false)}
      />

      <ConfirmModal
        visible={showResetConfirm2}
        title="Confirmación final"
        message="¿Estás completamente seguro? Todos tus datos serán eliminados para siempre."
        confirmLabel="Eliminar todo"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleConfirm2}
        onCancel={() => setShowResetConfirm2(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
    gap: Spacing[5],
  },
  section: {
    gap: Spacing[2],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing[1],
  },
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 56,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flex: 1,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  rowValue: {
    fontSize: Typography.fontSize.sm,
  },
  divider: {
    height: 0.5,
    marginHorizontal: Spacing[4],
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});
