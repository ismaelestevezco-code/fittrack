import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { SetLogRow } from '@/types/database.types';

interface SetRowProps {
  setNumber: number;
  targetReps: number;
  targetWeight: number;
  loggedSet: SetLogRow | undefined;
  restSeconds?: number;
  onLog: (reps: number, weight: number) => void;
  onUpdate: (setLogId: number, reps: number, weight: number) => void;
  onDelete: (setLogId: number) => void;
  onComplete?: (restSeconds: number) => void;
}

export function SetRow({
  setNumber,
  targetReps,
  targetWeight,
  loggedSet,
  restSeconds = 90,
  onLog,
  onUpdate,
  onDelete,
  onComplete,
}: SetRowProps) {
  const { colors } = useTheme();
  const [reps, setReps] = useState(loggedSet?.reps_done ?? (targetReps > 0 ? targetReps : 10));
  const [weight, setWeight] = useState(loggedSet?.weight_kg ?? targetWeight);
  const isLogged = loggedSet != null;

  useEffect(() => {
    if (loggedSet) {
      setReps(loggedSet.reps_done);
      setWeight(loggedSet.weight_kg);
    }
  }, [loggedSet?.reps_done, loggedSet?.weight_kg]);

  const handleComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLogged) {
      onUpdate(loggedSet.id, reps, weight);
    } else {
      onLog(reps, weight);
      onComplete?.(restSeconds);
    }
  }, [isLogged, loggedSet, reps, weight, onLog, onUpdate, onComplete, restSeconds]);

  const handleDelete = useCallback(() => {
    if (loggedSet) onDelete(loggedSet.id);
  }, [loggedSet, onDelete]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLogged ? `${colors.accent}0A` : colors.surface,
          borderColor: isLogged ? `${colors.accent}40` : colors.border,
        },
      ]}
    >
      {/* Número de serie */}
      <View
        style={[
          styles.setBadge,
          { backgroundColor: isLogged ? colors.accent : colors.surfaceHigh },
        ]}
      >
        <Text
          style={[
            styles.setLabel,
            { color: isLogged ? colors.background : colors.textSecondary },
          ]}
        >
          {setNumber}
        </Text>
      </View>

      {/* Steppers */}
      <View style={styles.steppers}>
        <Stepper
          value={weight}
          onChange={setWeight}
          min={0}
          max={999}
          step={2.5}
          decimals={1}
          unit="kg"
        />
        <View style={[styles.stepDivider, { backgroundColor: colors.border }]} />
        <Stepper
          value={reps}
          onChange={setReps}
          min={1}
          max={100}
          step={1}
          decimals={0}
          unit="rep"
        />
      </View>

      {/* Check */}
      <Pressable
        style={[
          styles.checkBtn,
          {
            backgroundColor: isLogged ? colors.accent : 'transparent',
            borderColor: isLogged ? colors.accent : colors.borderStrong,
          },
        ]}
        onPress={handleComplete}
        hitSlop={8}
      >
        <Text style={[styles.checkIcon, { color: isLogged ? colors.background : colors.textHint }]}>
          ✓
        </Text>
      </Pressable>

      {/* Delete (solo si logueado) */}
      {isLogged && (
        <Pressable style={styles.deleteBtn} onPress={handleDelete} hitSlop={8}>
          <Text style={[styles.deleteIcon, { color: colors.danger }]}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  decimals: number;
  unit: string;
}

function Stepper({ value, onChange, min, max, step, decimals, unit }: StepperProps) {
  const { colors } = useTheme();
  const [rawText, setRawText] = useState(decimals > 0 ? value.toFixed(decimals) : String(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setRawText(decimals > 0 ? value.toFixed(decimals) : String(value));
    }
  }, [value, decimals]);

  const decrement = useCallback(() => {
    const next = parseFloat((value - step).toFixed(decimals));
    if (next >= min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(next);
    }
  }, [value, step, decimals, min, onChange]);

  const increment = useCallback(() => {
    const next = parseFloat((value + step).toFixed(decimals));
    if (next <= max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(next);
    }
  }, [value, step, decimals, max, onChange]);

  const handleChangeText = useCallback((text: string) => {
    const normalized = text.replace(',', '.');
    setRawText(text);
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parseFloat(parsed.toFixed(decimals))));
      onChange(clamped);
    }
  }, [min, max, decimals, onChange]);

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
    <View style={[styles.stepper, { backgroundColor: colors.surfaceHigh }]}>
      <Pressable
        onPress={decrement}
        hitSlop={4}
        style={[styles.stepBtn, { backgroundColor: `${colors.primary}1F` }]}
      >
        <Text style={[styles.stepBtnText, { color: value <= min ? colors.textHint : colors.primary }]}>
          −
        </Text>
      </Pressable>
      <View style={styles.stepValueCol}>
        <TextInput
          value={rawText}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
          returnKeyType="done"
          selectTextOnFocus
          textAlign="center"
          style={[styles.stepValue, { color: colors.textPrimary }]}
        />
        <Text style={[styles.stepUnit, { color: colors.textHint }]}>{unit}</Text>
      </View>
      <Pressable
        onPress={increment}
        hitSlop={4}
        style={[styles.stepBtn, { backgroundColor: `${colors.primary}1F` }]}
      >
        <Text style={[styles.stepBtnText, { color: value >= max ? colors.textHint : colors.primary }]}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.setRowHeight,
    borderRadius: Layout.setRowRadius,
    borderWidth: 0.5,
    marginBottom: Spacing[2],
    paddingHorizontal: Spacing[2],
    gap: Spacing[2],
  },
  setBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLabel: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semibold,
  },
  steppers: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  stepDivider: {
    width: 1,
    height: 28,
  },
  stepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    height: 36,
  },
  stepBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: 24,
  },
  stepValueCol: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stepValue: {
    fontSize: 17,
    fontWeight: Typography.fontWeight.medium,
    minWidth: 36,
    width: '100%',
    textAlign: 'center',
    height: 22,
    padding: 0,
    includeFontPadding: false,
  } as const,
  stepUnit: {
    fontSize: 10,
    lineHeight: 12,
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: Typography.fontWeight.bold,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 13,
    fontWeight: Typography.fontWeight.bold,
  },
});
