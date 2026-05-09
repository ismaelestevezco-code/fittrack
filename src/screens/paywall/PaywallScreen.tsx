import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Purchases from 'react-native-purchases';
import { useNavigation } from '@react-navigation/native';
import { usePremium } from '@/context/PremiumContext';
import { useTheme } from '@/context/ThemeContext';
import { Gradients, Layout, Spacing, Typography } from '@/constants/theme';

const PRODUCT_ID_PLUS = 'fittrack_plus_lifetime';
const PRODUCT_ID_PRO_ANNUAL = 'fittrack_pro_annual';

interface TierFeature {
  text: string;
  included: boolean;
}

const FREE_FEATURES: TierFeature[] = [
  { text: '1 rutina activa', included: true },
  { text: 'Registro ilimitado de entrenamientos', included: true },
  { text: 'Historial de las últimas 4 semanas', included: true },
  { text: '1 métrica en gráficas de ejercicio', included: true },
  { text: 'Anuncios entre acciones', included: true },
];

const PLUS_FEATURES: TierFeature[] = [
  { text: 'Rutinas ilimitadas', included: true },
  { text: 'Historial completo sin límites', included: true },
  { text: 'Gráficas de progreso completas + 1RM', included: true },
  { text: 'Planning inteligente personalizado', included: true },
  { text: 'Medidas corporales con historial', included: true },
  { text: 'Backup automático en la nube', included: true },
  { text: 'Comparativa de semanas (4/8/12)', included: true },
  { text: 'Sin anuncios', included: true },
  { text: 'Coach IA con Claude', included: false },
];

const PRO_FEATURES: TierFeature[] = [
  { text: 'Todo lo de Plus', included: true },
  { text: 'Coach IA — 30 consultas/mes con Claude', included: true },
  { text: 'Plan ajustado a tu estado físico del día', included: true },
  { text: 'Predicción de progreso con fecha estimada', included: true },
  { text: 'Análisis de estancamiento con soluciones', included: true },
  { text: 'Desglose semanal por grupo muscular', included: true },
  { text: 'Exportación avanzada CSV + JSON', included: true },
  { text: 'Sin anuncios, nunca', included: true },
  { text: 'Acceso anticipado a nuevas features', included: true },
];

type PurchaseTab = 'plus' | 'pro';

export function PaywallScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { refreshTier } = usePremium();
  const [activeTab, setActiveTab] = useState<PurchaseTab>('plus');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = useCallback(async () => {
    const productId = activeTab === 'plus' ? PRODUCT_ID_PLUS : PRODUCT_ID_PRO_ANNUAL;
    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const products = await Purchases.getProducts([productId]);
      if (products.length === 0) {
        Alert.alert('Error', 'No se pudo cargar el producto. Inténtalo de nuevo.');
        return;
      }
      await Purchases.purchaseStoreProduct(products[0]);
      await refreshTier();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '¡Bienvenido a FitTrack ' + (activeTab === 'plus' ? 'Plus' : 'Pro') + '!',
        activeTab === 'plus'
          ? 'Tienes acceso completo al historial, gráficas, planning y backup en la nube.'
          : 'Tienes acceso completo más el Coach IA. ¡A por ello!',
        [{ text: 'Empezar', onPress: () => navigation.goBack() }],
      );
    } catch (err: unknown) {
      const error = err as { userCancelled?: boolean };
      if (!error.userCancelled) {
        Alert.alert('Error en la compra', 'No se pudo completar la compra. Inténtalo de nuevo.');
      }
    } finally {
      setPurchasing(false);
    }
  }, [activeTab, refreshTier, navigation]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      await Purchases.restorePurchases();
      await refreshTier();
      Alert.alert('Compras restauradas', 'Tus compras anteriores han sido restauradas correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudieron restaurar las compras.');
    } finally {
      setRestoring(false);
    }
  }, [refreshTier]);

  const features = activeTab === 'plus' ? PLUS_FEATURES : PRO_FEATURES;
  const price = activeTab === 'plus' ? '4,99€' : '14,99€';
  const period = activeTab === 'plus' ? 'pago único' : 'al año';
  const gradientColors = isDark ? Gradients.primary.dark : Gradients.primary.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={handleRestore} disabled={restoring} hitSlop={8}>
          {restoring
            ? <ActivityIndicator size="small" color={colors.textHint} />
            : <Text style={[styles.restoreText, { color: colors.textHint }]}>Restaurar compra</Text>
          }
        </Pressable>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroIcon}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={32} color={colors.background} />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Desbloquea FitTrack completo
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Sin suscripciones obligatorias. Elige el plan que encaje contigo.
          </Text>
        </View>

        <View style={[styles.tabRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {(['plus', 'pro'] as PurchaseTab[]).map(tab => (
            <Pressable
              key={tab}
              style={[
                styles.tabBtn,
                activeTab === tab && { backgroundColor: colors.surface },
              ]}
              onPress={() => {
                setActiveTab(tab);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[
                styles.tabLabel,
                { color: activeTab === tab ? colors.textPrimary : colors.textHint },
              ]}>
                {tab === 'plus' ? 'Plus — 4,99€ único' : 'Pro — 14,99€/año'}
              </Text>
              {tab === 'pro' && (
                <View style={[styles.popularBadge, { backgroundColor: `${colors.secondary}22` }]}>
                  <Text style={[styles.popularText, { color: colors.secondary }]}>Recomendado</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <View style={[styles.featuresCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {features.map((feat, i) => (
            <View
              key={i}
              style={[
                styles.featRow,
                i < features.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
              ]}
            >
              <MaterialCommunityIcons
                name={feat.included ? 'check-circle' : 'minus-circle-outline'}
                size={18}
                color={feat.included ? colors.accent : colors.textHint}
              />
              <Text style={[
                styles.featText,
                { color: feat.included ? colors.textPrimary : colors.textHint },
              ]}>
                {feat.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.freeCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.freeCardTitle, { color: colors.textSecondary }]}>Plan gratuito actual</Text>
          {FREE_FEATURES.map((feat, i) => (
            <View key={i} style={styles.freeRow}>
              <MaterialCommunityIcons
                name={feat.text === 'Anuncios entre acciones' ? 'advertisements' : 'check'}
                size={14}
                color={feat.text === 'Anuncios entre acciones' ? colors.warning : colors.textHint}
              />
              <Text style={[
                styles.freeRowText,
                { color: feat.text === 'Anuncios entre acciones' ? colors.warning : colors.textHint },
              ]}>
                {feat.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
          {price} · {period}
          {activeTab === 'pro' && (
            <Text style={{ color: colors.textHint }}> · Cancela cuando quieras</Text>
          )}
        </Text>
        <Pressable
          style={[styles.ctaBtn, purchasing && styles.ctaDisabled]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            {purchasing
              ? <ActivityIndicator size="small" color={colors.background} />
              : <Text style={[styles.ctaText, { color: colors.background }]}>
                  {activeTab === 'plus' ? 'Comprar FitTrack Plus' : 'Suscribirme a Pro'}
                </Text>
            }
          </LinearGradient>
        </Pressable>
        <Text style={[styles.legalNote, { color: colors.textHint }]}>
          {activeTab === 'plus'
            ? 'Pago único. Sin suscripción. Sin renovaciones.'
            : 'Se renueva automáticamente cada año. Cancela en cualquier momento desde los ajustes de tu cuenta de App Store o Google Play.'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  restoreText: {
    fontSize: Typography.fontSize.sm,
  },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[4],
    gap: Spacing[4],
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * 1.6,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderRadius: Layout.cardRadius - 3,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  popularBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.full,
  },
  popularText: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.semibold,
  },
  featuresCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  featText: {
    fontSize: Typography.fontSize.sm,
    flex: 1,
    lineHeight: Typography.fontSize.sm * 1.4,
  },
  freeCard: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[3],
    gap: Spacing[1],
  },
  freeCardTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[1],
  },
  freeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  freeRowText: {
    fontSize: Typography.fontSize.xs,
    flex: 1,
  },
  footer: {
    padding: Spacing[4],
    gap: Spacing[2],
    borderTopWidth: 0.5,
  },
  priceLabel: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  ctaBtn: {
    height: Layout.buttonHeight,
    borderRadius: Layout.buttonRadius,
    overflow: 'hidden',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.medium,
  },
  legalNote: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
