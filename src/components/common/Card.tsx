import React, { useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  elevated?: boolean;
}

export function Card({ children, style, padding = 4, elevated = false }: CardProps) {
  const { colors, isDark } = useTheme();

  const cardStyle = useMemo((): ViewStyle => ({
    backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: (Spacing as readonly number[])[padding] ?? Spacing[4],
    ...(isDark ? {} : (elevated ? Layout.shadow.md : Layout.shadow.sm)),
  }), [colors, isDark, elevated, padding]);

  return <View style={[cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  // estático vacío — todo inline via useMemo
  _: {},
});
