import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/common/NumberInput';
import { useProfileStore } from '@/stores/profileStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { Gradients, Layout, Spacing, Typography } from '@/constants/theme';
import type { OnboardingStackParamList } from '@/types/navigation.types';
import type { ProfileRow } from '@/types/database.types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'GoalSetup'>;
type Nav = Props['navigation'];
type Goal = ProfileRow['goal'];
type Experience = ProfileRow['experience_level'];
type Equipment = ProfileRow['equipment'];

interface GoalOption {
  value: Goal;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
}

interface EquipmentOption {
  value: Equipment;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { value: 'lose_weight', icon: 'trending-down', title: 'Perder peso', description: 'Reducir grasa corporal de forma sostenible' },
  { value: 'gain_muscle', icon: 'arm-flex', title: 'Ganar músculo', description: 'Aumentar masa muscular y fuerza' },
  { value: 'body_recomp', icon: 'scale-unbalanced', title: 'Recomposición', description: 'Bajar grasa y ganar músculo a la vez' },
  { value: 'maintenance', icon: 'scale-balance', title: 'Mantenimiento', description: 'Mantener el estado físico actual' },
  { value: 'sport_performance', icon: 'run-fast', title: 'Rendimiento', description: 'Mejorar el rendimiento deportivo' },
];

const EXPERIENCE_OPTIONS: Array<{ value: Experience; label: string }> = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
];

const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: 'full_gym', icon: 'weight-lifter', label: 'Gimnasio completo' },
  { value: 'home_gym', icon: 'home', label: 'Equipamiento en casa' },
  { value: 'no_equipment', icon: 'human-handsup', label: 'Sin equipamiento' },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  const { colors, isDark } = useTheme();
  const pct = Math.round((current / total) * 100);
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepRow}>
        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
          Paso {current} de {total}
        </Text>
        <Text style={[styles.stepPct, { color: colors.primary }]}>{pct}%</Text>
      </View>
      <View style={[styles.stepTrack, { backgroundColor: colors.border }]}>
        <LinearGradient
          colors={isDark ? Gradients.primary.dark : Gradients.primary.light}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.stepFill, { width: `${pct}%` }]}
        />
      </View>
    </View>
  );
}

export function GoalSetupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { pendingSetup, setPendingSetup } = useProfileStore();

  const [goal, setGoal] = useState<Goal>('lose_weight');
  const [experience, setExperience] = useState<Experience>('beginner');
  const [availableDays, setAvailableDays] = useState(3);
  const [equipment, setEquipment] = useState<Equipment>('full_gym');
  const saving = false;

  const handleStart = useCallback(() => {
    if (saving) return;
    setPendingSetup({
      goal,
      experience_level: experience,
      available_days: availableDays,
      equipment,
      units: 'metric',
      weighing_mode: 'daily',
      weighing_days: '[]',
      measurement_frequency: 'monthly',
    });
    navigation.navigate('TemplateSelection');
  }, [saving, setPendingSetup, goal, experience, availableDays, equipment, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <StepIndicator current={2} total={2} />

        <Text style={[styles.heading, { color: colors.textPrimary }]}>Tu objetivo</Text>
        <Text style={[styles.subheading, { color: colors.textSecondary }]}>
          Personalizamos la app según tus metas.
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>¿Qué quieres lograr?</Text>
        <View style={styles.goalGrid}>
          {GOAL_OPTIONS.map(opt => {
            const active = goal === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.goalCard,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  active && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
                ]}
                onPress={() => setGoal(opt.value)}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={22}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <View style={styles.goalCardText}>
                  <Text style={[styles.goalTitle, { color: active ? colors.primary : colors.textPrimary }]}>
                    {opt.title}
                  </Text>
                  <Text style={[styles.goalDescription, { color: colors.textSecondary }]}>
                    {opt.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Nivel de experiencia</Text>
        <View style={styles.toggleRow}>
          {EXPERIENCE_OPTIONS.map(opt => {
            const active = experience === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.toggleBtn,
                  { borderColor: colors.borderStrong, backgroundColor: colors.surfaceHigh },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setExperience(opt.value)}
              >
                <Text style={[
                  styles.toggleBtnText,
                  { color: colors.textSecondary },
                  active && { color: colors.background },
                ]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <NumberInput
          label="Días disponibles por semana"
          value={availableDays}
          onChange={setAvailableDays}
          min={1}
          max={7}
          unit="días"
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Equipamiento disponible</Text>
        <View style={styles.equipmentList}>
          {EQUIPMENT_OPTIONS.map(opt => {
            const active = equipment === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.equipmentBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  active && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
                ]}
                onPress={() => setEquipment(opt.value)}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={22}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.equipmentLabel,
                  { color: active ? colors.primary : colors.textPrimary },
                ]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button label="¡Comenzar!" onPress={handleStart} style={styles.cta} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  stepContainer: {
    marginBottom: Spacing[6],
    gap: Spacing[2],
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTrack: {
    height: 3,
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
  },
  stepFill: {
    height: 3,
    borderRadius: Layout.borderRadius.full,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
  },
  stepPct: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  heading: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  subheading: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[6],
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalGrid: {
    flexDirection: 'column',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  goalCard: {
    width: '100%',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  goalCardText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  goalDescription: {
    fontSize: Typography.fontSize.xs,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[6],
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: Layout.inputRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  equipmentList: {
    gap: Spacing[2],
    marginBottom: Spacing[6],
  },
  equipmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Layout.inputRadius,
    borderWidth: 1,
  },
  equipmentLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  error: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
  cta: {
    marginTop: Spacing[2],
  },
  loadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    marginTop: Spacing[2],
    height: 52,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
  },
});
