import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { NumberInput } from '@/components/common/NumberInput';
import { useProfileStore } from '@/stores/profileStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { Gradients, Layout, Spacing, Typography } from '@/constants/theme';
import type { OnboardingStackParamList } from '@/types/navigation.types';
import type { ProfileRow } from '@/types/database.types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileSetup'>;
type Sex = ProfileRow['sex'];

interface Errors {
  name?: string;
  age?: string;
  height?: string;
  weight?: string;
}

const SEX_OPTIONS: Array<{ value: Sex; label: string }> = [
  { value: 'male', label: 'Hombre' },
  { value: 'female', label: 'Mujer' },
  { value: 'other', label: 'Otro' },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  const { colors, isDark } = useTheme();
  const pct = Math.round((current / total) * 100);
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepRow}>
        <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
          Paso {current} de {total}
        </Text>
        <Text style={[styles.stepPct, { color: colors.primary }]}>{pct}%</Text>
      </View>
      <View style={[styles.stepTrack, { backgroundColor: colors.border }]}>
        <LinearGradient
          colors={isDark ? Gradients.primary.dark : Gradients.primary.light}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.stepFill, { width: `${pct}%` }]}
        />
      </View>
    </View>
  );
}

export function ProfileSetupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const setPendingSetup = useProfileStore(s => s.setPendingSetup);

  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [sex, setSex] = useState<Sex>('male');
  const [errors, setErrors] = useState<Errors>({});

  const validate = useCallback((): boolean => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'El nombre es obligatorio';
    if (age < 10 || age > 100) next.age = 'Debe estar entre 10 y 100 años';
    if (height < 100 || height > 250) next.height = 'Debe estar entre 100 y 250 cm';
    if (weight < 30 || weight > 300) next.weight = 'Debe estar entre 30 y 300 kg';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, age, height, weight]);

  const handleContinue = useCallback(() => {
    if (!validate()) return;
    setPendingSetup({
      name: name.trim(),
      age,
      height_cm: height,
      sex,
      initial_weight_kg: weight,
    });
    navigation.navigate('GoalSetup');
  }, [validate, setPendingSetup, name, age, height, sex, weight, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepIndicator current={1} total={2} />

          <Text style={[styles.heading, { color: colors.textPrimary }]}>Cuéntanos sobre ti</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            Usamos estos datos para calcular tus métricas de progreso.
          </Text>

          <Input
            label="Tu nombre"
            value={name}
            onChangeText={setName}
            placeholder="Ej: Carlos"
            autoCapitalize="words"
            autoCorrect={false}
            error={errors.name}
          />

          <NumberInput
            label="Edad"
            value={age}
            onChange={setAge}
            min={10}
            max={100}
            unit="años"
            error={errors.age}
          />

          <NumberInput
            label="Estatura"
            value={height}
            onChange={setHeight}
            min={100}
            max={250}
            unit="cm"
            error={errors.height}
          />

          <NumberInput
            label="Peso actual"
            value={weight}
            onChange={setWeight}
            min={30}
            max={300}
            step={0.01}
            decimals={2}
            unit="kg"
            error={errors.weight}
          />

          <View style={styles.selectorGroup}>
            <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Sexo</Text>
            <View style={styles.selectorRow}>
              {SEX_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.toggleBtn,
                    { borderColor: colors.borderStrong, backgroundColor: colors.surfaceHigh },
                    sex === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSex(opt.value)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: colors.textSecondary },
                      sex === opt.value && { color: colors.background },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button label="Continuar" onPress={handleContinue} style={styles.cta} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  stepContainer: {
    marginBottom: Spacing[6],
    gap: Spacing[2],
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTrack: {
    height: 3,
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
  },
  stepFill: {
    height: 3,
    borderRadius: Layout.borderRadius.full,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
  },
  stepPct: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  heading: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  subheading: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[6],
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  selectorGroup: {
    marginBottom: Spacing[4],
  },
  selectorLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[1],
  },
  selectorRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  toggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: Layout.inputRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  cta: {
    marginTop: Spacing[4],
  },
});
