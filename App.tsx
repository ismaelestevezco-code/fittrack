import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { initDatabase } from '@/database/database';
import { RootNavigator } from '@/navigation/RootNavigator';
import { SplashVideo } from '@/components/common/SplashVideo';
import { Typography, Spacing } from '@/constants/theme';

type DbStatus = 'loading' | 'ok' | 'error';

// Minimum time the splash is visible so the video has a chance to play
const MIN_SPLASH_MS = 2500;

function AppContent() {
  const { colors } = useTheme();
  const [dbStatus, setDbStatus] = useState<DbStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());

  useEffect(() => {
    initDatabase()
      .then(() => setDbStatus('ok'))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(msg);
        setDbStatus('error');
      });
  }, []);

  useEffect(() => {
    if (dbStatus === 'ok') {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
      const timer = setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setShowSplash(false));
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [dbStatus, splashOpacity]);

  if (dbStatus === 'error') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.danger }]}>
          Error al iniciar la base de datos
        </Text>
        <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {dbStatus === 'ok' && <RootNavigator />}
      {showSplash && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.splashLayer, { opacity: splashOpacity }]}
          pointerEvents={showSplash ? 'auto' : 'none'}
        >
          <SplashVideo />
        </Animated.View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  splashLayer: {
    zIndex: 999,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
  },
  errorTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});
