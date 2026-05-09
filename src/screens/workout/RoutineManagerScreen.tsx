import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { EmptyState } from '@/components/common/EmptyState';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/context/ThemeContext';
import { useTierLimits } from '@/hooks/useTierLimits';
import { usePaywall } from '@/hooks/usePaywall';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { WorkoutStackParamList } from '@/types/navigation.types';
import type { RoutineRow } from '@/types/database.types';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'RoutineManager'>;

export function RoutineManagerScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const limits = useTierLimits();
  const { openPaywall } = usePaywall();
  const {
    allRoutines,
    isLoading,
    loadAllRoutines,
    createRoutine,
    setActiveRoutine,
    deleteRoutine,
    renameRoutine,
  } = useWorkoutStore();

  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameError, setNewNameError] = useState('');
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<RoutineRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [renameTarget, setRenameTarget] = useState<RoutineRow | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    loadAllRoutines();
  }, []);

  const handleCreateRoutine = useCallback(async () => {
    if (newName.trim().length === 0) {
      setNewNameError('El nombre es obligatorio');
      return;
    }
    if (creating) return;
    setCreating(true);
    try {
      await createRoutine(newName.trim());
      setShowNewModal(false);
      setNewName('');
    } finally {
      setCreating(false);
    }
  }, [newName, creating, createRoutine]);

  const handleActivate = useCallback(
    async (routine: RoutineRow) => {
      if (routine.is_active === 1) return;
      await setActiveRoutine(routine.id);
    },
    [setActiveRoutine],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteRoutine(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleting, deleteRoutine]);

  const handleRename = useCallback(async () => {
    if (!renameTarget) return;
    if (renameName.trim().length === 0) {
      setRenameError('El nombre es obligatorio');
      return;
    }
    if (renaming) return;
    setRenaming(true);
    try {
      await renameRoutine(renameTarget.id, renameName.trim());
      setRenameTarget(null);
    } finally {
      setRenaming(false);
    }
  }, [renameTarget, renameName, renaming, renameRoutine]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        {allRoutines.length === 0 ? (
          <EmptyState
            icon="playlist-plus"
            title="Sin rutinas"
            description="Crea tu primera rutina para organizar tus entrenamientos por días."
            actionLabel="Crear primera rutina"
            onAction={() => {
              setNewName('');
              setShowNewModal(true);
            }}
          />
        ) : (
          <>
            {allRoutines.map(routine => {
              const isActive = routine.is_active === 1;
              return (
                <View
                  key={routine.id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isActive && { borderColor: colors.primary, borderWidth: 1.5 },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      {isActive ? (
                        <View style={styles.activeBadge}>
                          <MaterialCommunityIcons name="check-circle" size={12} color={colors.accent} />
                          <Text style={[styles.activeBadgeText, { color: colors.accent }]}>Activa</Text>
                        </View>
                      ) : null}
                      <Text style={[styles.routineName, { color: colors.textPrimary }]}>
                        {routine.name}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable
                        onPress={() => {
                          setRenameTarget(routine);
                          setRenameName(routine.name);
                          setRenameError('');
                        }}
                        hitSlop={8}
                        style={styles.actionBtn}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() => setDeleteTarget(routine)}
                        hitSlop={8}
                        style={styles.actionBtn}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>

                  {!isActive ? (
                    <Pressable
                      style={[styles.activateBtn, { borderColor: colors.primary }]}
                      onPress={() => handleActivate(routine)}
                    >
                      <Text style={[styles.activateBtnText, { color: colors.primary }]}>
                        Usar esta rutina
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.viewBtn}
                      onPress={() => navigation.navigate('WorkoutHome')}
                    >
                      <Text style={[styles.viewBtnText, { color: colors.primary }]}>
                        Ver entrenamiento semanal
                      </Text>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          label="Nueva rutina"
          onPress={() => {
            if (allRoutines.length >= limits.maxRoutines) {
              openPaywall('plus');
              return;
            }
            setNewName('');
            setNewNameError('');
            setShowNewModal(true);
          }}
        />
      </View>

      <Modal visible={showNewModal} onClose={() => setShowNewModal(false)}>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nueva rutina</Text>
        <Input
          label="Nombre de la rutina"
          value={newName}
          onChangeText={v => { setNewName(v); setNewNameError(''); }}
          placeholder="Ej: Rutina de fuerza"
          error={newNameError}
          autoFocus
        />
        <View style={styles.modalActions}>
          <Button label="Cancelar" onPress={() => setShowNewModal(false)} variant="secondary" style={styles.modalBtn} />
          <Button label="Crear" onPress={handleCreateRoutine} loading={creating} style={styles.modalBtn} />
        </View>
      </Modal>

      <Modal visible={renameTarget !== null} onClose={() => setRenameTarget(null)}>
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Renombrar rutina</Text>
        <Input
          label="Nuevo nombre"
          value={renameName}
          onChangeText={v => { setRenameName(v); setRenameError(''); }}
          error={renameError}
          autoFocus
        />
        <View style={styles.modalActions}>
          <Button label="Cancelar" onPress={() => setRenameTarget(null)} variant="secondary" style={styles.modalBtn} />
          <Button label="Guardar" onPress={handleRename} loading={renaming} style={styles.modalBtn} />
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteTarget !== null}
        title="¿Eliminar rutina?"
        message={`Se eliminará "${deleteTarget?.name}" junto con todos sus días, ejercicios y entrenamientos completados. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[4],
    flexGrow: 1,
  },
  card: {
    borderRadius: Layout.cardRadius,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  cardInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routineName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing[1],
  },
  actionBtn: {
    padding: Spacing[1],
  },
  activateBtn: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
    borderRadius: Layout.inputRadius,
    borderWidth: 1,
  },
  activateBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing[2],
  },
  viewBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderTopWidth: 0.5,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  modalBtn: {
    flex: 1,
  },
});
