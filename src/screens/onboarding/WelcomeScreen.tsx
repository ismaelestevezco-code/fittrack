import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/context/ThemeContext';
import { Gradients, Layout, Spacing, Typography } from '@/constants/theme';
import type { OnboardingStackParamList } from '@/types/navigation.types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

const FEATURES: Array<{
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
}> = [
  {
    icon: 'dumbbell',
    title: 'Registra tus entrenamientos',
    description: 'Anota series, repeticiones y peso. Todo en menos de 3 minutos.',
  },
  {
    icon: 'chart-line',
    title: 'Sigue tu progreso',
    description: 'Gráficas de evolución de peso y rendimiento semana a semana.',
  },
  {
    icon: 'calendar-check',
    title: 'Planning inteligente',
    description: 'Recomendaciones personalizadas basadas en tus datos reales.',
  },
];

export function WelcomeScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <LinearGradient
            colors={isDark ? Gradients.primary.dark : Gradients.primary.light}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={56} color={colors.background} />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>FitTrack</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Tu control físico personal</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map(feature => (
            <View
              key={feature.title}
              style={[styles.featureItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.surfaceHigh }]}>
                <MaterialCommunityIcons name={feature.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.noAccount, { color: colors.textHint }]}>
            Sin registro · Sin internet · 100% privado
          </Text>
          <Button
            label="Empezar ahora"
            onPress={() => navigation.navigate('ProfileSetup')}
            style={styles.cta}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[6],
    justifyContent: 'space-between',
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: Spacing[6],
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: Layout.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[1],
  },
  tagline: {
    fontSize: Typography.fontSize.base,
  },
  features: {
    gap: Spacing[4],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[4],
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    borderWidth: 0.5,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  featureDescription: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  footer: {
    gap: Spacing[3],
  },
  noAccount: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
  },
  cta: {
    width: '100%',
  },
});
