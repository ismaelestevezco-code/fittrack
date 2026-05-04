import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${colors.textPrimary}05`,
          borderColor: `${colors.textPrimary}1A`,
        },
      ]}
    >
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name={icon} size={26} color={colors.textHint} />
        </View>
      )}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="ghost" style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderStyle: 'dashed',
    padding: Spacing[6],
    alignItems: 'center',
    marginVertical: Spacing[4],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  title: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: Spacing[1],
  },
  description: {
    fontSize: Typography.fontSize.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing[4],
  },
  button: {
    minWidth: 180,
  },
});
