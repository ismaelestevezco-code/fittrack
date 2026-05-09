import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import type { AppTier } from '@/constants/tiers';
import { ENTITLEMENT_PLUS, ENTITLEMENT_PRO } from '@/constants/tiers';

// Claves públicas de cliente RevenueCat — no son secretos
const RC_API_KEY_IOS = 'test_hcZVayYNwzlPAxeSgyNcDwvmakh';
const RC_API_KEY_ANDROID = 'test_hcZVayYNwzlPAxeSgyNcDwvmakh';

interface PremiumContextValue {
  tier: AppTier;
  isPremium: boolean;
  isPro: boolean;
  isLoading: boolean;
  refreshTier: () => Promise<void>;
  presentPaywall: (targetTier?: 'plus' | 'pro') => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue>({
  tier: 'free',
  isPremium: false,
  isPro: false,
  isLoading: true,
  refreshTier: async () => undefined,
  presentPaywall: async () => undefined,
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<AppTier>('free');
  const [isLoading, setIsLoading] = useState(true);

  const determineTier = useCallback(async (): Promise<AppTier> => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlements = customerInfo.entitlements.active;
      if (ENTITLEMENT_PRO in entitlements) return 'pro';
      if (ENTITLEMENT_PLUS in entitlements) return 'plus';
      return 'free';
    } catch {
      return 'free';
    }
  }, []);

  const refreshTier = useCallback(async () => {
    const newTier = await determineTier();
    setTier(newTier);
  }, [determineTier]);

  useEffect(() => {
    async function init() {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }
        const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
        Purchases.configure({ apiKey });
        await refreshTier();
      } catch {
        // Si RevenueCat falla, mantener 'free'
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [refreshTier]);

  const presentPaywall = useCallback(async (_targetTier?: 'plus' | 'pro') => {
    // Implementado via usePaywall hook + PaywallScreen
  }, []);

  const value: PremiumContextValue = {
    tier,
    isPremium: tier === 'plus' || tier === 'pro',
    isPro: tier === 'pro',
    isLoading,
    refreshTier,
    presentPaywall,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextValue {
  return useContext(PremiumContext);
}
