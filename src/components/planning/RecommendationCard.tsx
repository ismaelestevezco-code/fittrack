import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { RecommendationItem } from '@/types/domain.types';

interface RecommendationCardProps {
  item: RecommendationItem;
}

export function RecommendationCard({ item }: RecommendationCardProps) {
  const { colors } = useTheme();

  const CATEGORY_CONFIG: Record<
    RecommendationItem['category'],
    { label: string; color: string }
  > = {
    training:       { label: 'Entrenamiento', color: colors.primary },
    weight:         { label: 'Peso',          color: colors.secondary },
    recovery:       { label: 'Recuperación',  color: colors.warning },
    nutrition_hint: { label: 'Nutrición',     color: colors.accent },
    general:        { label: 'General',       color: colors.textSecondary },
  };

  const PRIORITY_DOT: Record<RecommendationItem['priority'], string> = {
    high:   colors.danger,
    medium: colors.warning,
    low:    colors.textHint,
  };

  const cat = CATEGORY_CONFIG[item.category];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${cat.color}1A` }]}>
        <MaterialCommunityIcons
          name={item.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
          size={22}
          color={cat.color}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_DOT[item.priority] }]} />
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: `${cat.color}15` }]}>
          <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
    flexDirection: 'row',
    gap: Spacing[3],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: Spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * 1.5,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.full,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
