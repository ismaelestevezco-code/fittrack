import React, { useState, useCallback } from 'react';
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
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@/context/ThemeContext';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { Gradients, Layout, Spacing, Typography } from '@/constants/theme';
import { getRecommendedTemplates, ROUTINE_TEMPLATES } from '@/constants/routineTemplates';
import type { RoutineTemplate } from '@/constants/routineTemplates';
import type { OnboardingStackParamList } from '@/types/navigation.types';
import type { CreateProfileInput } from '@/repositories/ProfileRepository';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'TemplateSelection'>;

const LEVEL_LABELS = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const EQUIPMENT_LABELS = {
  full_gym: 'Gimnasio completo',
  home_gym: 'Casa con equipo',
  no_equipment: 'Sin equipamiento',
};

export function TemplateSelectionScreen({ navigation: _navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { pendingSetup, createProfile } = useProfileStore();
  const { createRoutineFromTemplate, createRoutine } = useWorkoutStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const equipment = (pendingSetup.equipment ?? 'full_gym') as 'full_gym' | 'home_gym' | 'no_equipment';
  const availableDays = pendingSetup.available_days ?? 3;
  const experience = (pendingSetup.experience_level ?? 'beginner') as 'beginner' | 'intermediate' | 'advanced';

  const recommended = getRecommendedTemplates(equipment, availableDays, experience);
  const displayTemplates = recommended.length > 0 ? recommended : ROUTINE_TEMPLATES;

  const handleSelect = useCallback((template: RoutineTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(template.id);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedId || saving) return;
    const template = ROUTINE_TEMPLATES.find(t => t.id === selectedId);
    if (!template) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createProfile(pendingSetup as CreateProfileInput);
      await createRoutineFromTemplate(template);
    } catch {
      setSaving(false);
    }
  }, [selectedId, saving, pendingSetup, createProfile, createRoutineFromTemplate]);

  const handleSkip = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await createProfile(pendingSetup as CreateProfileInput);
      await createRoutine('Mi primera rutina');
    } catch {
      setSaving(false);
    }
  }, [saving, pendingSetup, createProfile, createRoutine]);

  const gradientColors = isDark ? Gradients.primary.dark : Gradients.primary.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Elige tu rutina inicial
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Puedes modificarla en cualquier momento o crear la tuya propia.
        </Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {displayTemplates.map(template => {
          const isSelected = selectedId === template.id;
          return (
            <Pressable
              key={template.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 1.5 : 0.5,
                },
              ]}
              onPress={() => handleSelect(template)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <MaterialCommunityIcons
                    name={isSelected ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={isSelected ? colors.primary : colors.textHint}
                  />
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    {template.name}
                  </Text>
                </View>
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {template.daysPerWeek}d/sem
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${colors.secondary}15` }]}>
                    <Text style={[styles.badgeText, { color: colors.secondary }]}>
                      {LEVEL_LABELS[template.level]}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {template.description}
              </Text>
              <Text style={[styles.equipText, { color: colors.textHint }]}>
                {EQUIPMENT_LABELS[template.equipment]}
              </Text>
            </Pressable>
          );
        })}

        <View style={styles.skipRow}>
          <Pressable onPress={handleSkip} hitSlop={12} disabled={saving}>
            <Text style={[styles.skipText, { color: colors.textHint }]}>
              Prefiero crear mi propia rutina →
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.ctaBtn, (!selectedId || saving) && styles.ctaDisabled]}
          onPress={handleConfirm}
          disabled={!selectedId || saving}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.background} />
              : <Text style={[styles.ctaText, { color: colors.background }]}>
                  Empezar con esta rutina
                </Text>
            }
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    padding: Spacing[4],
    paddingBottom: Spacing[2],
    gap: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  scroll: {
    padding: Spacing[4],
    gap: Spacing[3],
    paddingBottom: Spacing[6],
  },
  card: {
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  cardHeader: {
    gap: Spacing[2],
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  cardTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Layout.borderRadius.full ?? 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
  },
  cardDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  equipText: {
    fontSize: Typography.fontSize.xs,
  },
  skipRow: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  skipText: {
    fontSize: Typography.fontSize.sm,
  },
  footer: {
    padding: Spacing[4],
    borderTopWidth: 0.5,
  },
  ctaBtn: {
    height: Layout.buttonHeight,
    borderRadius: Layout.buttonRadius,
    overflow: 'hidden',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.medium,
  },
});
