import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecommendationCard } from '@/components/planning/RecommendationCard';
import { parseRecommendations, parseSummary } from '@/stores/planningStore';
import { fromTimestamp } from '@/utils/dateUtils';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { WeeklyPlanRow } from '@/types/database.types';

interface PlanningWeekCardProps {
  plan: WeeklyPlanRow;
}

export function PlanningWeekCard({ plan }: PlanningWeekCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const recommendations = parseRecommendations(plan);
  const summary = parseSummary(plan);

  const generatedDate = fromTimestamp(plan.generated_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}
        onPress={() => setExpanded(v => !v)}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.weekLabel, { color: colors.textPrimary }]}>
            Semana {plan.week_number}
          </Text>
          <Text style={[styles.yearLabel, { color: colors.textSecondary }]}>{plan.year}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.recsCount, { color: colors.textSecondary }]}>
            {recommendations.length} recom.
          </Text>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={[styles.body, { borderTopColor: colors.border }]}>
          {summary ? (
            <Text style={[styles.summary, { color: colors.textSecondary }]}>{summary}</Text>
          ) : null}
          <Text style={[styles.generatedAt, { color: colors.textHint }]}>
            Generado el {generatedDate}
          </Text>
          {recommendations.map(rec => (
            <RecommendationCard key={rec.id} item={rec} />
          ))}
          {recommendations.length === 0 && (
            <Text style={[styles.empty, { color: colors.textHint }]}>
              Sin recomendaciones guardadas.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing[2],
  },
  weekLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  yearLabel: {
    fontSize: Typography.fontSize.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  recsCount: {
    fontSize: Typography.fontSize.xs,
  },
  body: {
    borderTopWidth: 0.5,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  summary: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * 1.5,
    fontStyle: 'italic',
  },
  generatedAt: {
    fontSize: Typography.fontSize.xs,
  },
  empty: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing[2],
  },
});
