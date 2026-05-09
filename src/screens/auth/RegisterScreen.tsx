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
import { registerUser, isEmailWhitelisted, friendlyAuthError } from '@/firebase/authService';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Typography, Layout } from '@/constants/theme';
import type { AuthStackParamList } from '@/types/navigation.types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password || !confirmPassword) {
      setError('Rellena todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Verificar whitelist antes de crear la cuenta
      const allowed = await isEmailWhitelisted(trimmedEmail);
      if (!allowed) {
        setError(
          'Este correo no está autorizado para usar FitTrack.\nContacta con el administrador para solicitar acceso.',
        );
        setIsLoading(false);
        return;
      }

      await registerUser(trimmedEmail, password);
      // El AuthContext detectará automáticamente el nuevo usuario y navegará a la app
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
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Crear cuenta</Text>

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
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textHint}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmar contraseña</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Repite la contraseña"
            placeholderTextColor={colors.textHint}
          />

          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>Crear cuenta</Text>
            )}
          </Pressable>

          <Pressable style={styles.link} onPress={() => navigation.goBack()}>
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              ¿Ya tienes cuenta?{' '}
              <Text style={[styles.linkBold, { color: colors.primary }]}>Iniciar sesión</Text>
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
