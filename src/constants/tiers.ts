export type AppTier = 'free' | 'plus' | 'pro';

// Identificadores de entitlement en RevenueCat
export const ENTITLEMENT_PLUS = 'fittrack_plus';
export const ENTITLEMENT_PRO = 'fittrack_pro';

export const TIER_LIMITS = {
  free: {
    maxRoutines: 1,
    historyWeeks: 4,
    weightHistoryWeeks: 4,
    comparisonWeeks: [4] as number[],
    exerciseGraphMetrics: 1,
    planningEnabled: false,
    measurementsEnabled: false,
    firebaseEnabled: false,
    coachAIEnabled: false,
    coachAIMonthlyLimit: 0,
  },
  plus: {
    maxRoutines: Infinity,
    historyWeeks: Infinity,
    weightHistoryWeeks: Infinity,
    comparisonWeeks: [4, 8, 12] as number[],
    exerciseGraphMetrics: 4,
    planningEnabled: true,
    measurementsEnabled: true,
    firebaseEnabled: true,
    coachAIEnabled: false,
    coachAIMonthlyLimit: 0,
  },
  pro: {
    maxRoutines: Infinity,
    historyWeeks: Infinity,
    weightHistoryWeeks: Infinity,
    comparisonWeeks: [4, 8, 12] as number[],
    exerciseGraphMetrics: 4,
    planningEnabled: true,
    measurementsEnabled: true,
    firebaseEnabled: true,
    coachAIEnabled: true,
    coachAIMonthlyLimit: 30,
  },
} as const;

export type TierLimits = typeof TIER_LIMITS[AppTier];
