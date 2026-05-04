import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { Gradients, Spacing } from '@/constants/theme';

interface AccentLineProps {
  marginBottom?: number;
}

export function AccentLine({ marginBottom = Spacing[4] }: AccentLineProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Gradients.primary.dark : Gradients.primary.light;

  return (
    <View style={[styles.wrapper, { marginBottom }]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    opacity: 0.6,
  },
  line: {
    height: 2,
    borderRadius: 1,
    width: '100%',
  },
});
