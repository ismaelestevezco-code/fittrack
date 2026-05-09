export default ({ config }) => ({
  ...config,
  name: 'Fit Track',
  slug: 'fittrack',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'cover',
    backgroundColor: '#071428',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.fittrack.app',
    userInterfaceStyle: 'automatic',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#071428',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
      'android.permission.USE_EXACT_ALARM',
    ],
    package: 'com.fittrack.app',
    userInterfaceStyle: 'automatic',
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-sqlite',
    ['expo-image-picker', {
      photosPermission: 'FitTrack necesita acceso a tu galería para cambiar tu foto de perfil.',
      cameraPermission: 'FitTrack necesita acceso a la cámara para tomar una foto de perfil.',
    }],
    'expo-video',
    ['expo-notifications', { color: '#00D4FF' }],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: process.env.ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713',
        iosAppId: process.env.ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511',
      },
    ],
  ],
  extra: {
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    admobIosInterstitialId: process.env.ADMOB_IOS_INTERSTITIAL_ID,
    admobAndroidInterstitialId: process.env.ADMOB_ANDROID_INTERSTITIAL_ID,
    eas: { projectId: 'a2acadac-d2c5-44bc-98f3-2cbf3077336e' },
  },
});
