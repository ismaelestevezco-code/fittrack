import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { NumberInput } from '@/components/common/NumberInput';
import { useProfileStore } from '@/stores/profileStore';
import { usePremium } from '@/context/PremiumContext';
import { usePaywall } from '@/hooks/usePaywall';
import {
  GOAL_LABELS,
  SEX_LABELS,
  EXPERIENCE_LABELS,
  EQUIPMENT_LABELS,
  formatHeight,
} from '@/utils/formatUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/firebase/authService';
import { uploadSnapshot } from '@/firebase/syncService';
import { ADMIN_EMAIL } from '@/firebase/firebaseConfig';
import { Gradients, Layout, Spacing, Typography } from '@/constants/theme';
import { APP_VERSION } from '@/constants/config';
import type { ProfileStackParamList } from '@/types/navigation.types';
import type { ProfileRow } from '@/types/database.types';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;
type EditSection = 'personal' | 'goal' | 'level' | 'equipment' | null;

type SexOption = ProfileRow['sex'];
type GoalOption = ProfileRow['goal'];
type ExperienceOption = ProfileRow['experience_level'];
type EquipmentOption = ProfileRow['equipment'];

function OptionButton<T extends string>({
  value,
  selected,
  label,
  onPress,
  rowFlex = false,
}: {
  value: T;
  selected: T;
  label: string;
  onPress: (v: T) => void;
  rowFlex?: boolean;
}) {
  const { colors } = useTheme();
  const active = value === selected;
  return (
    <Pressable
      style={[
        styles.optionBtn,
        rowFlex && styles.optionBtnFlex,
        { borderColor: colors.borderStrong, backgroundColor: colors.surfaceElevated },
        active && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.optionText,
          { color: colors.textPrimary },
          active && { color: colors.background },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ProfileHomeScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const { profile, isLoading, updateProfile } = useProfileStore();
  const { user } = useAuth();
  const { tier, isPremium } = usePremium();
  const { openPaywall } = usePaywall();

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar sesión? Tu progreso está guardado en la nube.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            if (user) {
              await uploadSnapshot(user.uid);
            }
            await logoutUser();
          },
        },
      ],
    );
  }, [user]);

  const [editSection, setEditSection] = useState<EditSection>(null);
  const [saving, setSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const pickFromGallery = useCallback(async () => {
    setShowAvatarModal(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso denegado', 'FitTrack necesita acceso a tu galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ avatar_uri: result.assets[0].uri });
    }
  }, [updateProfile]);

  const takePhoto = useCallback(async () => {
    setShowAvatarModal(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso denegado', 'FitTrack necesita acceso a la cámara para tomar una foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ avatar_uri: result.assets[0].uri });
    }
  }, [updateProfile]);

  const removeAvatar = useCallback(async () => {
    setShowAvatarModal(false);
    await updateProfile({ avatar_uri: null });
  }, [updateProfile]);

  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(25);
  const [editHeight, setEditHeight] = useState(170);
  const [editSex, setEditSex] = useState<SexOption>('male');

  const [editGoal, setEditGoal] = useState<GoalOption>('maintenance');

  const [editLevel, setEditLevel] = useState<ExperienceOption>('beginner');
  const [editDays, setEditDays] = useState(3);

  const [editEquipment, setEditEquipment] = useState<EquipmentOption>('full_gym');

  const openEdit = useCallback(
    (section: EditSection) => {
      if (!profile) return;
      if (section === 'personal') {
        setEditName(profile.name);
        setEditAge(profile.age);
        setEditHeight(profile.height_cm);
        setEditSex(profile.sex);
      } else if (section === 'goal') {
        setEditGoal(profile.goal);
      } else if (section === 'level') {
        setEditLevel(profile.experience_level);
        setEditDays(profile.available_days);
      } else if (section === 'equipment') {
        setEditEquipment(profile.equipment);
      }
      setEditSection(section);
    },
    [profile],
  );

  const handleSave = useCallback(async () => {
    if (!profile || saving) return;
    if (editSection === 'personal' && !editName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      if (editSection === 'personal') {
        await updateProfile({
          name: editName.trim(),
          age: editAge,
          height_cm: editHeight,
          sex: editSex,
        });
      } else if (editSection === 'goal') {
        await updateProfile({ goal: editGoal });
      } else if (editSection === 'level') {
        await updateProfile({ experience_level: editLevel, available_days: editDays });
      } else if (editSection === 'equipment') {
        await updateProfile({ equipment: editEquipment });
      }
      setEditSection(null);
    } finally {
      setSaving(false);
    }
  }, [profile, saving, editSection, editName, editAge, editHeight, editSex, editGoal, editLevel, editDays, editEquipment, updateProfile]);

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const units = profile.units;
  const initial = profile.name.trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Perfil</Text>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          hitSlop={8}
          style={[styles.settingsBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <MaterialCommunityIcons name="cog-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <Pressable onPress={() => setShowAvatarModal(true)} style={styles.avatarWrapper}>
            {profile.avatar_uri ? (
              <Image source={{ uri: profile.avatar_uri }} style={styles.avatarImg} />
            ) : (
              <LinearGradient
                colors={isDark ? Gradients.primary.dark : Gradients.primary.light}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={[styles.avatarText, { color: colors.background }]}>{initial}</Text>
              </LinearGradient>
            )}
            <View style={[styles.avatarCamBtn, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="camera-outline" size={14} color={colors.background} />
            </View>
          </Pressable>
          <Text style={[styles.avatarName, { color: colors.textPrimary }]}>{profile.name}</Text>
        </View>

        {/* Tier card */}
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={isPremium ? undefined : () => openPaywall()}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[3] }}>
            <MaterialCommunityIcons
              name={tier === 'pro' ? 'crown' : tier === 'plus' ? 'star' : 'star-outline'}
              size={20}
              color={tier === 'pro' ? colors.secondary : tier === 'plus' ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.cardTitle, { color: tier === 'pro' ? colors.secondary : tier === 'plus' ? colors.accent : colors.textSecondary, flex: 1 }]}>
              FitTrack {tier === 'free' ? 'Gratis' : tier === 'plus' ? 'Plus' : 'Pro'}
            </Text>
            {!isPremium && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ color: colors.primary, fontSize: Typography.fontSize.sm }}>Mejorar plan</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
              </View>
            )}
          </View>
        </Pressable>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Datos personales</Text>
            <Pressable onPress={() => openEdit('personal')} hitSlop={8}>
              <Text style={[styles.editLink, { color: colors.primary }]}>Editar</Text>
            </Pressable>
          </View>
          <InfoRow label="Edad" value={`${profile.age} años`} />
          <InfoRow label="Estatura" value={formatHeight(profile.height_cm, units)} />
          <InfoRow label="Sexo" value={SEX_LABELS[profile.sex] ?? profile.sex} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Objetivo actual</Text>
            <Pressable onPress={() => openEdit('goal')} hitSlop={8}>
              <Text style={[styles.editLink, { color: colors.primary }]}>Editar</Text>
            </Pressable>
          </View>
          <InfoRow label="Meta" value={GOAL_LABELS[profile.goal] ?? profile.goal} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Nivel y disponibilidad</Text>
            <Pressable onPress={() => openEdit('level')} hitSlop={8}>
              <Text style={[styles.editLink, { color: colors.primary }]}>Editar</Text>
            </Pressable>
          </View>
          <InfoRow label="Nivel" value={EXPERIENCE_LABELS[profile.experience_level] ?? profile.experience_level} />
          <InfoRow label="Días disponibles" value={`${profile.available_days} días/semana`} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Equipamiento</Text>
            <Pressable onPress={() => openEdit('equipment')} hitSlop={8}>
              <Text style={[styles.editLink, { color: colors.primary }]}>Editar</Text>
            </Pressable>
          </View>
          <InfoRow label="Disponible" value={EQUIPMENT_LABELS[profile.equipment] ?? profile.equipment} />
        </View>


        {/* Cerrar sesión */}
        <Pressable
          style={[styles.actionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
          <Text style={[styles.actionRowText, { color: colors.danger }]}>Cerrar sesión</Text>
        </Pressable>

        <Text style={[styles.version, { color: colors.textHint }]}>FitTrack v{APP_VERSION}</Text>
      </ScrollView>

      <Modal visible={editSection === 'personal'} onClose={() => setEditSection(null)}>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Datos personales</Text>
        <View style={styles.modalForm}>
          <Input
            label="Nombre"
            value={editName}
            onChangeText={setEditName}
            placeholder="Tu nombre"
          />
          <NumberInput label="Edad" value={editAge} onChange={setEditAge} min={10} max={100} step={1} decimals={0} unit="años" />
          <NumberInput label="Estatura" value={editHeight} onChange={setEditHeight} min={100} max={250} step={1} decimals={0} unit="cm" />
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Sexo</Text>
          <View style={styles.optionRow}>
            {(['male', 'female', 'other'] as SexOption[]).map(s => (
              <OptionButton key={s} value={s} selected={editSex} label={SEX_LABELS[s]} onPress={setEditSex} rowFlex />
            ))}
          </View>
        </View>
        <View style={styles.modalActions}>
          <Button label="Cancelar" onPress={() => setEditSection(null)} variant="secondary" style={styles.modalBtn} />
          <Button label="Guardar" onPress={handleSave} loading={saving} style={styles.modalBtn} />
        </View>
      </Modal>

      <Modal visible={editSection === 'goal'} onClose={() => setEditSection(null)}>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Objetivo actual</Text>
        <View style={styles.modalForm}>
          {(['lose_weight', 'gain_muscle', 'body_recomp', 'maintenance', 'sport_performance'] as GoalOption[]).map(g => (
            <OptionButton key={g} value={g} selected={editGoal} label={GOAL_LABELS[g]} onPress={setEditGoal} />
          ))}
        </View>
        <View style={styles.modalActions}>
          <Button label="Cancelar" onPress={() => setEditSection(null)} variant="secondary" style={styles.modalBtn} />
          <Button label="Guardar" onPress={handleSave} loading={saving} style={styles.modalBtn} />
        </View>
      </Modal>

      <Modal visible={editSection === 'level'} onClose={() => setEditSection(null)}>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nivel y disponibilidad</Text>
        <View style={styles.modalForm}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nivel de experiencia</Text>
          <View style={styles.optionRow}>
            {(['beginner', 'intermediate', 'advanced'] as ExperienceOption[]).map(e => (
              <OptionButton key={e} value={e} selected={editLevel} label={EXPERIENCE_LABELS[e]} onPress={setEditLevel} rowFlex />
            ))}
          </View>
          <NumberInput label="Días disponibles" value={editDays} onChange={setEditDays} min={1} max={7} step={1} decimals={0} unit="días" />
        </View>
        <View style={styles.modalActions}>
          <Button label="Cancelar" onPress={() => setEditSection(null)} variant="secondary" style={styles.modalBtn} />
          <Button label="Guardar" onPress={handleSave} loading={saving} style={styles.modalBtn} />
        </View>
      </Modal>

      <Modal visible={editSection === 'equipment'} onClose={() => setEditSection(null)}>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Equipamiento</Text>
        <View style={styles.modalForm}>
          {(['full_gym', 'home_gym', 'no_equipment'] as EquipmentOption[]).map(e => (
            <OptionButton key={e} value={e} selected={editEquipment} label={EQUIPMENT_LABELS[e]} onPress={setEditEquipment} rowFlex />
          ))}
        </View>
        <View style={styles.modalActions}>
          <Button label="Cancelar" onPress={() => setEditSection(null)} variant="secondary" style={styles.modalBtn} />
          <Button label="Guardar" onPress={handleSave} loading={saving} style={styles.modalBtn} />
        </View>
      </Modal>

      <Modal visible={showAvatarModal} onClose={() => setShowAvatarModal(false)}>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Foto de perfil</Text>
        <View style={styles.avatarOptions}>
          <Pressable
            style={[styles.avatarOption, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={pickFromGallery}
          >
            <MaterialCommunityIcons name="image-outline" size={28} color={colors.primary} />
            <Text style={[styles.avatarOptionLabel, { color: colors.textPrimary }]}>Galería</Text>
          </Pressable>
          <Pressable
            style={[styles.avatarOption, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={takePhoto}
          >
            <MaterialCommunityIcons name="camera-outline" size={28} color={colors.primary} />
            <Text style={[styles.avatarOptionLabel, { color: colors.textPrimary }]}>Cámara</Text>
          </Pressable>
        </View>
        {profile.avatar_uri ? (
          <Button label="Eliminar foto" onPress={removeAvatar} variant="destructive" />
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.borderRadius.full,
  },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
    gap: Spacing[4],
  },
  avatarSection: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
  },
  avatarWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarCamBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  avatarName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  avatarOptions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  avatarOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
  },
  avatarOptionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editLink: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderTopWidth: 0.5,
  },
  infoLabel: {
    fontSize: Typography.fontSize.base,
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  version: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    paddingTop: Spacing[2],
  },
  modalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[4],
  },
  modalForm: {
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  optionBtn: {
    width: '100%',
    minHeight: 44,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBtnFlex: {
    flex: 1,
    width: undefined,
  },
  optionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  modalBtn: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  actionRowText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
});
