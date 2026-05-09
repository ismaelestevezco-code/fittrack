import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { usePremium } from '@/context/PremiumContext';
import { usePaywall } from '@/hooks/usePaywall';
import { useTheme } from '@/context/ThemeContext';
import { Gradients, Layout, Spacing, Typography } from '@/constants/theme';
import type { AppTier } from '@/constants/tiers';

interface PremiumGateProps {
  requiredTier: 'plus' | 'pro';
  children: React.ReactNode;
  feature?: string;
  compact?: boolean;
}

// Envuelve una feature premium. Si el usuario no tiene el tier requerido,
// muestra un CTA para comprar en lugar del contenido.
export function PremiumGate({ requiredTier, children, feature, compact = false }: PremiumGateProps) {
  const { tier } = usePremium();
  const { openPaywall } = usePaywall();
  const { colors, isDark } = useTheme();

  const tierOrder: AppTier[] = ['free', 'plus', 'pro'];
  const hasAccess = tierOrder.indexOf(tier) >= tierOrder.indexOf(requiredTier);

  if (hasAccess) return <>{children}</>;

  if (compact) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          openPaywall(requiredTier);
        }}
        style={[styles.compactBadge, { backgroundColor: `${colors.secondary}1A`, borderColor: `${colors.secondary}40` }]}
      >
        <MaterialCommunityIcons name="lock" size={12} color={colors.secondary} />
        <Text style={[styles.compactText, { color: colors.secondary }]}>
          {requiredTier === 'plus' ? 'Plus' : 'Pro'}
        </Text>
      </Pressable>
    );
  }

  const tierLabel = requiredTier === 'plus' ? 'FitTrack Plus' : 'FitTrack Pro';
  const gradientColors = isDark ? Gradients.primary.dark : Gradients.primary.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lockIcon}
        >
          <MaterialCommunityIcons name="lock-open-variant" size={28} color={colors.background} />
        </LinearGradient>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {feature ? `${feature} es exclusivo de ${tierLabel}` : `Función exclusiva de ${tierLabel}`}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {requiredTier === 'plus'
            ? 'Desbloquea el historial completo, gráficas de progreso, planning inteligente, backup en la nube y elimina los anuncios por un pago único de 4,99€.'
            : 'Activa el Coach IA con Claude, predicciones de progreso y análisis avanzado por 14,99€/año.'
          }
        </Text>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            openPaywall(requiredTier);
          }}
          style={styles.ctaBtn}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={[styles.ctaText, { color: colors.background }]}>
              Ver planes
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
  },
  content: {
    alignItems: 'center',
    gap: Spacing[4],
    maxWidth: 320,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    lineHeight: Typography.fontSize.md * 1.4,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  ctaBtn: {
    width: '100%',
    height: Layout.buttonHeight,
    borderRadius: Layout.buttonRadius,
    overflow: 'hidden',
    marginTop: Spacing[2],
  },
  ctaGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.medium,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 0.5,
  },
  compactText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
  },
});
