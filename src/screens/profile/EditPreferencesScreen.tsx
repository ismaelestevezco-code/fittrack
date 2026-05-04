import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/common/NumberInput';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { ProfileStackParamList } from '@/types/navigation.types';
import type { ProfileRow } from '@/types/database.types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditPreferences'>;
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
  {
    value: 'lose_weight',
    icon: 'trending-down',
    title: 'Perder peso',
    description: 'Reducir grasa corporal de forma sostenible',
  },
  {
    value: 'gain_muscle',
    icon: 'arm-flex',
    title: 'Ganar músculo',
    description: 'Aumentar masa muscular y fuerza',
  },
  {
    value: 'body_recomp',
    icon: 'scale-unbalanced',
    title: 'Recomposición',
    description: 'Bajar grasa y ganar músculo a la vez',
  },
  {
    value: 'maintenance',
    icon: 'scale-balance',
    title: 'Mantenimiento',
    description: 'Mantener el estado físico actual',
  },
  {
    value: 'sport_performance',
    icon: 'run-fast',
    title: 'Rendimiento',
    description: 'Mejorar el rendimiento deportivo',
  },
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

export function EditPreferencesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { profile, updateProfile } = useProfileStore();

  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'maintenance');
  const [experience, setExperience] = useState<Experience>(
    profile?.experience_level ?? 'beginner',
  );
  const [availableDays, setAvailableDays] = useState(profile?.available_days ?? 3);
  const [equipment, setEquipment] = useState<Equipment>(profile?.equipment ?? 'full_gym');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      await updateProfile({
        goal,
        experience_level: experience,
        available_days: availableDays,
        equipment,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [saving, updateProfile, goal, experience, availableDays, equipment, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>¿Qué quieres lograr?</Text>
        <View style={styles.goalGrid}>
          {GOAL_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              style={[
                styles.goalCard,
                { borderColor: colors.border, backgroundColor: colors.surface },
                goal === opt.value && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
              ]}
              onPress={() => setGoal(opt.value)}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={28}
                color={goal === opt.value ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.goalTitle,
                  { color: colors.textPrimary },
                  goal === opt.value && { color: colors.primary },
                ]}
              >
                {opt.title}
              </Text>
              <Text style={[styles.goalDescription, { color: colors.textSecondary }]}>{opt.description}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Nivel de experiencia</Text>
        <View style={styles.toggleRow}>
          {EXPERIENCE_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              style={[
                styles.toggleBtn,
                { borderColor: colors.borderStrong, backgroundColor: colors.surfaceElevated },
                experience === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setExperience(opt.value)}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: colors.textSecondary },
                  experience === opt.value && { color: colors.background },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
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
          {EQUIPMENT_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              style={[
                styles.equipmentBtn,
                { borderColor: colors.border, backgroundColor: colors.surface },
                equipment === opt.value && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
              ]}
              onPress={() => setEquipment(opt.value)}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={22}
                color={equipment === opt.value ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.equipmentLabel,
                  { color: colors.textPrimary },
                  equipment === opt.value && { color: colors.primary },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {saving ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Guardando...</Text>
          </View>
        ) : (
          <Button label="Guardar cambios" onPress={handleSave} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[4],
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  goalCard: {
    width: '47%',
    padding: Spacing[4],
    borderRadius: Layout.cardRadius,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: Spacing[2],
  },
  goalTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  goalDescription: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: Typography.fontSize.xs * 1.5,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[6],
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1.5,
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
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1.5,
  },
  equipmentLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderTopWidth: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    height: 52,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
  },
});
