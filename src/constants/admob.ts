import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { TestIds } from 'react-native-google-mobile-ads';

const IS_DEV = __DEV__;

const extra = Constants.expoConfig?.extra ?? {};

function getInterstitialId(): string {
  if (IS_DEV) {
    return TestIds.INTERSTITIAL;
  }
  if (Platform.OS === 'ios') {
    return (extra.admobIosInterstitialId as string) ?? '';
  }
  return (extra.admobAndroidInterstitialId as string) ?? '';
}

export const ADMOB_INTERSTITIAL_ID = getInterstitialId();

// Intervalo mínimo entre anuncios: 3 minutos
export const ADMOB_MIN_INTERVAL_MS = 3 * 60 * 1000;
