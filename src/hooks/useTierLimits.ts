import { usePremium } from '@/context/PremiumContext';
import { TIER_LIMITS, type TierLimits } from '@/constants/tiers';

// Devuelve los límites aplicables al tier actual del usuario.
// Uso: const limits = useTierLimits();
// Ejemplo: if (routines.length >= limits.maxRoutines) → mostrar paywall
export function useTierLimits(): TierLimits {
  const { tier } = usePremium();
  return TIER_LIMITS[tier];
}
