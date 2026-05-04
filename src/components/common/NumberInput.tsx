import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  decimals?: number;
  error?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit,
  decimals = 0,
  error,
}: NumberInputProps) {
  const { colors, isDark } = useTheme();
  const idleBorder = isDark ? colors.borderStrong : `${colors.primary}40`;
  const [rawText, setRawText] = useState(decimals > 0 ? value.toFixed(decimals) : String(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setRawText(decimals > 0 ? value.toFixed(decimals) : String(value));
    }
  }, [value, decimals]);

  const handleDecrement = useCallback(() => {
    const next = parseFloat((value - step).toFixed(decimals));
    if (next >= min) onChange(next);
  }, [value, step, decimals, min, onChange]);

  const handleIncrement = useCallback(() => {
    const next = parseFloat((value + step).toFixed(decimals));
    if (next <= max) onChange(next);
  }, [value, step, decimals, max, onChange]);

  const handleChangeText = useCallback(
    (text: string) => {
      const normalized = text.replace(',', '.');
      setRawText(text);
      const parsed = parseFloat(normalized);
      if (!isNaN(parsed)) {
        const clamped = Math.min(max, Math.max(min, parseFloat(parsed.toFixed(decimals))));
        onChange(clamped);
      }
    },
    [min, max, decimals, onChange],
  );

  const handleBlur = useCallback(() => {
    isFocused.current = false;
    const normalized = rawText.replace(',', '.');
    const parsed = parseFloat(normalized);
    const final = isNaN(parsed)
      ? value
      : Math.min(max, Math.max(min, parseFloat(parsed.toFixed(decimals))));
    setRawText(decimals > 0 ? final.toFixed(decimals) : String(final));
    onChange(final);
  }, [rawText, value, min, max, decimals, onChange]);

  const handleFocus = useCallback(() => {
    isFocused.current = true;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.surfaceHigh,
            borderColor: error ? colors.danger : idleBorder,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? `${colors.primary}1F` : `${colors.primary}0F` },
          ]}
          onPress={handleDecrement}
          disabled={value <= min}
          accessibilityLabel={`Reducir ${label}`}
        >
          <Text style={[styles.buttonText, { color: value <= min ? colors.textHint : colors.primary }]}>
            −
          </Text>
        </Pressable>

        <View style={styles.valueContainer}>
          <TextInput
            style={[styles.value, { color: colors.textPrimary }]}
            value={rawText}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            onFocus={handleFocus}
            keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
            returnKeyType="done"
            selectTextOnFocus
            textAlign="center"
          />
          {unit && <Text style={[styles.unit, { color: colors.textHint }]}>{unit}</Text>}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? `${colors.primary}1F` : `${colors.primary}0F` },
          ]}
          onPress={handleIncrement}
          disabled={value >= max}
          accessibilityLabel={`Aumentar ${label}`}
        >
          <Text style={[styles.buttonText, { color: value >= max ? colors.textHint : colors.primary }]}>
            +
          </Text>
        </Pressable>
      </View>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Layout.inputRadius,
    overflow: 'hidden',
    height: Layout.inputHeight,
  },
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: 28,
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
  },
  value: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    minWidth: 48,
    textAlign: 'center',
    padding: 0,
  },
  unit: {
    fontSize: Typography.fontSize.body,
  },
  error: {
    marginTop: Spacing[1],
    fontSize: Typography.fontSize.caption,
  },
});
