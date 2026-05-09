import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { loginUser, isEmailWhitelisted, friendlyAuthError } from '@/firebase/authService';
import { smartSync } from '@/firebase/syncService';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Typography, Layout } from '@/constants/theme';
import type { AuthStackParamList } from '@/types/navigation.types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Introduce tu correo y contraseña.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Verificar whitelist antes de permitir login
      const allowed = await isEmailWhitelisted(trimmedEmail);
      if (!allowed) {
        setError('Tu cuenta no está autorizada para usar FitTrack. Contacta con el administrador.');
        setIsLoading(false);
        return;
      }

      const user = await loginUser(trimmedEmail, password);
      await smartSync(user.uid);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(friendlyAuthError(code));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/icon.png')} style={styles.logo} />
          <Text style={[styles.appName, { color: colors.textPrimary }]}>FitTrack</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Tu progreso físico, siempre contigo
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Iniciar sesión</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Correo electrónico</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textHint}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Contraseña</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textHint}
          />

          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>Entrar</Text>
            )}
          </Pressable>

          <Pressable style={styles.link} onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              ¿No tienes cuenta?{' '}
              <Text style={[styles.linkBold, { color: colors.primary }]}>Crear cuenta</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing[6],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: Layout.borderRadius.xl,
    marginBottom: Spacing[3],
  },
  appName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing[1],
  },
  card: {
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing[6],
    ...Layout.shadow.md,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[5],
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[1],
  },
  input: {
    borderWidth: 1,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing[4],
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: Layout.borderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  button: {
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  link: {
    marginTop: Spacing[5],
    alignItems: 'center',
  },
  linkText: {
    fontSize: Typography.fontSize.sm,
  },
  linkBold: {
    fontWeight: Typography.fontWeight.semibold,
  },
});
