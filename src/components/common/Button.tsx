import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { Gradients, Layout, Spacing, Typography } from '@/constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'secondary' | 'destructive' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  leftIcon,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const isDisabled = disabled || loading;

  const gradientColors = useMemo(
    () => (isDark ? Gradients.primary.dark : Gradients.primary.light),
    [isDark],
  );

  const containerStyle: ViewStyle = useMemo(() => {
    switch (variant) {
      case 'ghost':
      case 'secondary':
        return {
          backgroundColor: `${colors.primary}14`,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        };
      case 'destructive':
        return {
          backgroundColor: `${colors.danger}1A`,
          borderWidth: 1,
          borderColor: `${colors.danger}66`,
        };
      default:
        return {};
    }
  }, [variant, colors]);

  const labelColor = useMemo(() => {
    switch (variant) {
      case 'ghost':
      case 'secondary':
        return colors.primary;
      case 'destructive':
        return colors.danger;
      default:
        return isDark ? colors.background : '#FFFFFF';
    }
  }, [variant, colors, isDark]);

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, isDisabled && styles.disabled, style]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        {({ pressed }) => (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, pressed && !isDisabled && styles.pressed]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isDark ? colors.background : '#FFFFFF'} />
            ) : (
              <View style={styles.labelRow}>
                {leftIcon}
                <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
              </View>
            )}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <View style={styles.labelRow}>
          {leftIcon}
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// Botón icono cuadrado para headers
export function IconButton({
  icon,
  onPress,
  style,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: colors.surfaceHigh },
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
    >
      <View>{icon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: Layout.buttonHeight,
    borderRadius: Layout.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.buttonRadius,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  label: {
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.button,
    textAlign: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
