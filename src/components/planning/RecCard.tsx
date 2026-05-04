import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';

interface RecCardProps {
  title: string;
  description: string;
}

export function RecCard({ title, description }: RecCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: `${colors.secondary}14`,
          borderColor: `${colors.secondary}40`,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
        <Text style={[styles.title, { color: colors.secondary }]}>{title}</Text>
      </View>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: Spacing[3],
    gap: Spacing[1],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.medium,
  },
  body: {
    fontSize: 10,
    lineHeight: 15,
    paddingLeft: Spacing[2] + 6,
  },
});
