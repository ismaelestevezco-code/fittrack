import React from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
}

export function Input({ label, value, onChangeText, error, hint, ...rest }: InputProps) {
  const { colors, isDark } = useTheme();
  const idleBorder = isDark ? colors.borderStrong : `${colors.primary}40`;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceHigh,
            borderColor: error ? colors.danger : idleBorder,
            color: colors.textPrimary,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textHint}
        {...rest}
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      {!error && hint ? <Text style={[styles.hint, { color: colors.textHint }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[4],
  },
  label: {
    fontSize: Typography.fontSize.label,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.06,
  },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderRadius: Layout.inputRadius,
    paddingHorizontal: Spacing[4],
    fontSize: Typography.fontSize.bodyLg,
  },
  error: {
    marginTop: Spacing[1],
    fontSize: Typography.fontSize.caption,
  },
  hint: {
    marginTop: Spacing[1],
    fontSize: Typography.fontSize.caption,
  },
});
