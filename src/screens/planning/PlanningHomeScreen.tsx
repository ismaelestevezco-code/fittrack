import React, { useEffect, useCallback } from 'react';
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
import { RecommendationCard } from '@/components/planning/RecommendationCard';
import { EmptyState } from '@/components/common/EmptyState';
import { PremiumGate } from '@/components/common/PremiumGate';
import { Button } from '@/components/common/Button';
import { usePlanningStore, parseRecommendations, parseSummary } from '@/stores/planningStore';
import { useTheme } from '@/context/ThemeContext';
import { fromTimestamp } from '@/utils/dateUtils';
import { getWeekAndYear } from '@/utils/dateUtils';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { PlanningStackParamList } from '@/types/navigation.types';
import type { RecommendationItem } from '@/types/domain.types';
import { useAds } from '@/context/AdContext';

type Nav = NativeStackNavigationProp<PlanningStackParamList>;

const CATEGORY_ORDER: RecommendationItem['category'][] = [
  'recovery',
  'training',
  'weight',
  'nutrition_hint',
  'general',
];

const CATEGORY_LABELS: Record<RecommendationItem['category'], string> = {
  recovery: 'Recuperación',
  training: 'Entrenamiento',
  weight: 'Peso',
  nutrition_hint: 'Nutrición',
  general: 'General',
};

export function PlanningHomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { currentPlan, isLoading, isGenerating, loadCurrentPlan, generatePlan } =
    usePlanningStore();
  const { showInterstitialIfEligible } = useAds();

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const handleGenerate = useCallback(async () => {
    await generatePlan();
    // Anuncio después de generar el planning, sin bloquear la navegación
    showInterstitialIfEligible();
  }, [generatePlan, showInterstitialIfEligible]);

  const { weekNumber, year } = getWeekAndYear(new Date());

  const recommendations = currentPlan ? parseRecommendations(currentPlan) : [];
  const summary = currentPlan ? parseSummary(currentPlan) : '';

  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    items: recommendations.filter(r => r.category === cat),
  })).filter(g => g.items.length > 0);

  const generatedDate = currentPlan
    ? fromTimestamp(currentPlan.generated_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PremiumGate requiredTier="plus" feature="Planning inteligente">
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Planning</Text>
          <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>
            Semana {weekNumber} · {year}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('PlanningHistory')}
          hitSlop={8}
          style={[styles.historyBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <MaterialCommunityIcons name="clock-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        {!currentPlan ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="calendar-star"
              title="Sin planning esta semana"
              description="Genera tu planning semanal para recibir recomendaciones personalizadas basadas en tu progreso real."
            />
          </View>
        ) : (
          <>
            {summary ? (
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{summary}</Text>
                {generatedDate && (
                  <Text style={[styles.generatedAt, { color: colors.textHint }]}>
                    Generado el {generatedDate}
                  </Text>
                )}
              </View>
            ) : null}

            {grouped.length === 0 ? (
              <Text style={[styles.noRecs, { color: colors.textSecondary }]}>
                No hay recomendaciones para esta semana. ¡Sigue así!
              </Text>
            ) : (
              grouped.map(({ cat, items }) => (
                <View key={cat} style={styles.group}>
                  <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                  {items.map(rec => (
                    <RecommendationCard key={rec.id} item={rec} />
                  ))}
                </View>
              ))
            )}
          </>
        )}

        <Button
          label={currentPlan ? 'Actualizar planning' : 'Generar mi planning'}
          onPress={handleGenerate}
          loading={isGenerating}
          variant={currentPlan ? 'secondary' : 'primary'}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  weekLabel: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  historyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.borderRadius.full,
    marginTop: 4,
  },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
    gap: Spacing[4],
  },
  emptyWrap: {
    flex: 1,
  },
  summaryCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  summaryText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  generatedAt: {
    fontSize: Typography.fontSize.xs,
  },
  noRecs: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    paddingVertical: Spacing[4],
  },
  group: {
    gap: Spacing[3],
  },
  groupTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing[1],
  },
});
