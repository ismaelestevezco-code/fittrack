import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import {
  InterstitialAd,
  AdEventType,
  type RequestOptions,
} from 'react-native-google-mobile-ads';
import { usePremium } from '@/context/PremiumContext';
import { ADMOB_INTERSTITIAL_ID, ADMOB_MIN_INTERVAL_MS } from '@/constants/admob';

interface AdContextValue {
  // Muestra un intersticial si el usuario es Free y ha pasado el intervalo mínimo.
  // Llama a onComplete cuando el anuncio se cierra (o si no se muestra por cualquier razón).
  showInterstitialIfEligible: (onComplete?: () => void) => void;
  isAdReady: boolean;
}

const AdContext = createContext<AdContextValue>({
  showInterstitialIfEligible: (onComplete) => onComplete?.(),
  isAdReady: false,
});

export function AdProvider({ children }: { children: React.ReactNode }) {
  const { tier } = usePremium();
  const [isAdReady, setIsAdReady] = useState(false);
  const lastAdShownAt = useRef<number>(0);
  const interstitialRef = useRef<InterstitialAd | null>(null);
  const pendingCallbackRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (tier !== 'free') {
      interstitialRef.current = null;
      setIsAdReady(false);
      return;
    }

    const requestOptions: RequestOptions = {
      requestNonPersonalizedAdsOnly: false,
    };

    const interstitial = InterstitialAd.createForAdRequest(
      ADMOB_INTERSTITIAL_ID,
      requestOptions,
    );

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => setIsAdReady(true),
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsAdReady(false);
        lastAdShownAt.current = Date.now();
        const callback = pendingCallbackRef.current;
        pendingCallbackRef.current = undefined;
        callback?.();
        interstitial.load();
      },
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      () => {
        setIsAdReady(false);
        const callback = pendingCallbackRef.current;
        pendingCallbackRef.current = undefined;
        callback?.();
        setTimeout(() => interstitial.load(), 30000);
      },
    );

    interstitialRef.current = interstitial;
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [tier]);

  const showInterstitialIfEligible = useCallback(
    (onComplete?: () => void) => {
      if (tier !== 'free') {
        onComplete?.();
        return;
      }

      const now = Date.now();
      if (now - lastAdShownAt.current < ADMOB_MIN_INTERVAL_MS) {
        onComplete?.();
        return;
      }

      if (!isAdReady || !interstitialRef.current) {
        onComplete?.();
        return;
      }

      pendingCallbackRef.current = onComplete;
      interstitialRef.current.show();
    },
    [tier, isAdReady],
  );

  return (
    <AdContext.Provider value={{ showInterstitialIfEligible, isAdReady }}>
      {children}
    </AdContext.Provider>
  );
}

export function useAds(): AdContextValue {
  return useContext(AdContext);
}
