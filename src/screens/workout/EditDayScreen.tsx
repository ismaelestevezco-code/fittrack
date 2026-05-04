import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { NumberInput } from '@/components/common/NumberInput';
import { EmptyState } from '@/components/common/EmptyState';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { WorkoutStackParamList } from '@/types/navigation.types';
import type { ExerciseCategoryRow, ExerciseRow } from '@/types/database.types';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'EditDay'>;

interface ExerciseForm {
  name: string;
  target_sets: number;
  target_reps: number;
  target_weight_kg: number;
  rest_seconds: number;
  notes: string;
  category_id: number | null;
}

const DEFAULT_FORM: ExerciseForm = {
  name: '',
  target_sets: 3,
  target_reps: 10,
  target_weight_kg: 0,
  rest_seconds: 90,
  notes: '',
  category_id: null,
};

// ─── Inner component: one category section ───────────────────────────────────

interface CategoryGroupProps {
  title: string;
  categoryId?: number;
  exercises: ExerciseRow[];
  onEditExercise: (exercise: ExerciseRow) => void;
  onDeleteExercise: (exercise: ExerciseRow) => void;
  onRenameCategory?: () => void;
  onDeleteCategory?: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function CategoryGroup({
  title,
  categoryId,
  exercises,
  onEditExercise,
  onDeleteExercise,
  onRenameCategory,
  onDeleteCategory,
  colors,
}: CategoryGroupProps) {
  return (
    <View style={{ marginBottom: Spacing[4] }}>
      {/* Category header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: Spacing[2],
          paddingHorizontal: Spacing[3],
          backgroundColor: `${colors.primary}12`,
          borderRadius: Layout.borderRadius.sm,
          marginBottom: Spacing[1],
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: Typography.fontSize.sm,
            fontWeight: Typography.fontWeight.semibold,
            color: categoryId !== undefined ? colors.primary : colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {title}
        </Text>
        {categoryId !== undefined && (
          <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
            <Pressable onPress={onRenameCategory} hitSlop={8}>
              <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={onDeleteCategory} hitSlop={8}>
              <MaterialCommunityIcons name="trash-can-outline" size={15} color={colors.danger} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Exercises in this group */}
      {exercises.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: Layout.cardRadius,
            borderWidth: 0.5,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          {exercises.map((exercise, idx) => (
            <View
              key={exercise.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: Spacing[3],
                paddingHorizontal: Spacing[4],
                borderBottomWidth: idx < exercises.length - 1 ? 0.5 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: Typography.fontWeight.medium,
                    color: colors.textPrimary,
                  }}
                  numberOfLines={1}
                >
                  {exercise.name}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                  {exercise.target_sets} × {exercise.target_reps}
                  {exercise.target_weight_kg > 0 ? ` · ${exercise.target_weight_kg} kg` : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing[1] }}>
                <Pressable onPress={() => onEditExercise(exercise)} hitSlop={8} style={{ padding: Spacing[1] }}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
                </Pressable>
                <Pressable onPress={() => onDeleteExercise(exercise)} hitSlop={8} style={{ padding: Spacing[1] }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            color: colors.textHint,
            paddingHorizontal: Spacing[3],
            paddingVertical: Spacing[2],
            fontStyle: 'italic',
          }}
        >
          Sin ejercicios en esta categoría
        </Text>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function EditDayScreen({ navigation, route }: Props) {
  const { routineDayId } = route.params;
  const { colors } = useTheme();
  const {
    routineDays,
    updateDay,
    getDayExercises,
    addExercise,
    updateExercise,
    deleteExercise,
    getDayCategories,
    addCategory,
    renameCategory,
    deleteCategory,
    setExerciseCategory,
  } = useWorkoutStore();

  const day = routineDays.find(d => d.id === routineDayId);

  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [categories, setCategories] = useState<ExerciseCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayName, setDayName] = useState(day?.name ?? '');
  const [isRestDay, setIsRestDay] = useState((day?.is_rest_day ?? 0) === 1);
  const [savingDay, setSavingDay] = useState(false);

  // Exercise modal state
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseRow | null>(null);
  const [form, setForm] = useState<ExerciseForm>(DEFAULT_FORM);
  const [savingExercise, setSavingExercise] = useState(false);
  const [nameError, setNameError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<ExerciseRow | null>(null);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExerciseCategoryRow | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryNameError, setCategoryNameError] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<ExerciseCategoryRow | null>(null);

  const refreshExercises = useCallback(async () => {
    const data = await getDayExercises(routineDayId);
    setExercises(data);
  }, [routineDayId, getDayExercises]);

  const refreshCategories = useCallback(async () => {
    const data = await getDayCategories(routineDayId);
    setCategories(data);
  }, [routineDayId, getDayCategories]);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshExercises(), refreshCategories()]).finally(() => setLoading(false));
  }, [routineDayId]);

  useEffect(() => {
    if (day) {
      navigation.setOptions({ title: `Editar: ${day.name}` });
      setDayName(day.name);
      setIsRestDay(day.is_rest_day === 1);
    }
  }, [day, navigation]);

  const handleSaveDay = useCallback(async () => {
    if (savingDay || !day) return;
    setSavingDay(true);
    await updateDay(routineDayId, {
      name: dayName.trim() || day.name,
      is_rest_day: isRestDay ? 1 : 0,
    });
    setSavingDay(false);
  }, [savingDay, day, routineDayId, dayName, isRestDay, updateDay]);

  // ── Exercise modal handlers ──────────────────────────────────────────────

  const openAddExercise = useCallback(() => {
    setEditingExercise(null);
    setForm(DEFAULT_FORM);
    setNameError('');
    setShowExerciseModal(true);
  }, []);

  const openEditExercise = useCallback((exercise: ExerciseRow) => {
    setEditingExercise(exercise);
    setForm({
      name: exercise.name,
      target_sets: exercise.target_sets,
      target_reps: exercise.target_reps,
      target_weight_kg: exercise.target_weight_kg,
      rest_seconds: exercise.rest_seconds,
      notes: exercise.notes ?? '',
      category_id: exercise.category_id,
    });
    setNameError('');
    setShowExerciseModal(true);
  }, []);

  const handleSaveExercise = useCallback(async () => {
    if (form.name.trim().length === 0) {
      setNameError('El nombre es obligatorio');
      return;
    }
    if (savingExercise) return;
    setSavingExercise(true);
    try {
      if (editingExercise) {
        await updateExercise(editingExercise.id, {
          name: form.name.trim(),
          target_sets: form.target_sets,
          target_reps: form.target_reps,
          target_weight_kg: form.target_weight_kg,
          rest_seconds: form.rest_seconds,
          notes: form.notes.trim() || null,
        });
        // Update category separately if it changed
        if (form.category_id !== editingExercise.category_id) {
          await setExerciseCategory(editingExercise.id, form.category_id);
        }
      } else {
        await addExercise({
          routine_day_id: routineDayId,
          name: form.name.trim(),
          target_sets: form.target_sets,
          target_reps: form.target_reps,
          target_weight_kg: form.target_weight_kg,
          rest_seconds: form.rest_seconds,
          notes: form.notes.trim() || null,
          category_id: form.category_id,
        });
      }
      await refreshExercises();
      setShowExerciseModal(false);
    } finally {
      setSavingExercise(false);
    }
  }, [
    form,
    savingExercise,
    editingExercise,
    routineDayId,
    updateExercise,
    addExercise,
    setExerciseCategory,
    refreshExercises,
  ]);

  const handleDeleteExercise = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteExercise(deleteTarget.id, routineDayId);
    setDeleteTarget(null);
    await refreshExercises();
  }, [deleteTarget, routineDayId, deleteExercise, refreshExercises]);

  // ── Category modal handlers ──────────────────────────────────────────────

  const openAddCategory = useCallback(() => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryNameError('');
    setShowCategoryModal(true);
  }, []);

  const openRenameCategory = useCallback((cat: ExerciseCategoryRow) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryNameError('');
    setShowCategoryModal(true);
  }, []);

  const handleSaveCategory = useCallback(async () => {
    if (categoryName.trim().length === 0) {
      setCategoryNameError('El nombre es obligatorio');
      return;
    }
    if (savingCategory) return;
    setSavingCategory(true);
    try {
      if (editingCategory) {
        await renameCategory(editingCategory.id, categoryName.trim());
      } else {
        await addCategory(routineDayId, categoryName.trim());
      }
      await refreshCategories();
      setShowCategoryModal(false);
    } finally {
      setSavingCategory(false);
    }
  }, [
    categoryName,
    savingCategory,
    editingCategory,
    routineDayId,
    renameCategory,
    addCategory,
    refreshCategories,
  ]);

  const handleDeleteCategory = useCallback(async () => {
    if (!deleteCategoryTarget) return;
    await deleteCategory(deleteCategoryTarget.id);
    setDeleteCategoryTarget(null);
    // Reload both: exercises lose their category_id (ON DELETE SET NULL)
    await Promise.all([refreshExercises(), refreshCategories()]);
  }, [deleteCategoryTarget, deleteCategory, refreshExercises, refreshCategories]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const uncategorizedExercises = exercises.filter(e => e.category_id == null);
  const hasCategorizedExercises = exercises.some(e => e.category_id != null);
  const hasCategories = categories.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        {/* Day configuration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Configuración del día
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Input
              label="Nombre del día"
              value={dayName}
              onChangeText={setDayName}
              onBlur={handleSaveDay}
              placeholder="Ej: Pecho y Tríceps"
            />
            <View style={styles.restRow}>
              <Text style={[styles.restLabel, { color: colors.textPrimary }]}>Día de descanso</Text>
              <Switch
                value={isRestDay}
                onValueChange={v => {
                  setIsRestDay(v);
                  updateDay(routineDayId, { is_rest_day: v ? 1 : 0 });
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </View>
        </View>

        {!isRestDay ? (
          <>
            {/* Categories section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Categorías</Text>
                <Pressable
                  style={[styles.addBtn, { borderColor: colors.primary }]}
                  onPress={openAddCategory}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                  <Text style={[styles.addBtnText, { color: colors.primary }]}>Nueva</Text>
                </Pressable>
              </View>

              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : !hasCategories && exercises.length === 0 ? (
                <EmptyState
                  icon="dumbbell"
                  title="Sin ejercicios"
                  description="Añade ejercicios a este día de entrenamiento."
                  actionLabel="Añadir ejercicio"
                  onAction={openAddExercise}
                />
              ) : (
                <>
                  {/* Uncategorized exercises — only shown when there are also categories */}
                  {(hasCategories || hasCategorizedExercises) && uncategorizedExercises.length > 0 && (
                    <CategoryGroup
                      title="Sin categoría"
                      exercises={uncategorizedExercises}
                      onEditExercise={openEditExercise}
                      onDeleteExercise={setDeleteTarget}
                      colors={colors}
                    />
                  )}

                  {/* Flat list when no categories at all */}
                  {!hasCategories && exercises.length > 0 && (
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: Layout.cardRadius,
                        borderWidth: 0.5,
                        borderColor: colors.border,
                        overflow: 'hidden',
                      }}
                    >
                      {exercises.map((exercise, idx) => (
                        <View
                          key={exercise.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: Spacing[3],
                            paddingHorizontal: Spacing[4],
                            borderBottomWidth: idx < exercises.length - 1 ? 0.5 : 0,
                            borderBottomColor: colors.border,
                          }}
                        >
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text
                              style={{
                                fontSize: Typography.fontSize.base,
                                fontWeight: Typography.fontWeight.medium,
                                color: colors.textPrimary,
                              }}
                              numberOfLines={1}
                            >
                              {exercise.name}
                            </Text>
                            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                              {exercise.target_sets} × {exercise.target_reps}
                              {exercise.target_weight_kg > 0 ? ` · ${exercise.target_weight_kg} kg` : ''}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: Spacing[1] }}>
                            <Pressable
                              onPress={() => openEditExercise(exercise)}
                              hitSlop={8}
                              style={{ padding: Spacing[1] }}
                            >
                              <MaterialCommunityIcons
                                name="pencil-outline"
                                size={18}
                                color={colors.textSecondary}
                              />
                            </Pressable>
                            <Pressable
                              onPress={() => setDeleteTarget(exercise)}
                              hitSlop={8}
                              style={{ padding: Spacing[1] }}
                            >
                              <MaterialCommunityIcons
                                name="trash-can-outline"
                                size={18}
                                color={colors.danger}
                              />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* One CategoryGroup per category */}
                  {categories.map(cat => (
                    <CategoryGroup
                      key={cat.id}
                      title={cat.name}
                      categoryId={cat.id}
                      exercises={exercises.filter(e => e.category_id === cat.id)}
                      onEditExercise={openEditExercise}
                      onDeleteExercise={setDeleteTarget}
                      onRenameCategory={() => openRenameCategory(cat)}
                      onDeleteCategory={() => setDeleteCategoryTarget(cat)}
                      colors={colors}
                    />
                  ))}
                </>
              )}
            </View>

            {/* Exercises section header with add button */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Ejercicios</Text>
                <Pressable
                  style={[styles.addBtn, { borderColor: colors.primary }]}
                  onPress={openAddExercise}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                  <Text style={[styles.addBtnText, { color: colors.primary }]}>Añadir</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* ── Exercise modal ───────────────────────────────────────────────── */}
      <Modal
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        contentStyle={styles.modalContent}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            {editingExercise ? 'Editar ejercicio' : 'Nuevo ejercicio'}
          </Text>
          <Input
            label="Nombre del ejercicio"
            value={form.name}
            onChangeText={v => {
              setForm(f => ({ ...f, name: v }));
              setNameError('');
            }}
            placeholder="Ej: Press de Banca"
            error={nameError}
          />
          <NumberInput
            label="Series"
            value={form.target_sets}
            onChange={v => setForm(f => ({ ...f, target_sets: v }))}
            min={1}
            max={20}
          />
          <NumberInput
            label="Repeticiones objetivo (0 = sin objetivo)"
            value={form.target_reps}
            onChange={v => setForm(f => ({ ...f, target_reps: v }))}
            min={0}
            max={100}
          />
          <NumberInput
            label="Peso objetivo en kg (0 = sin objetivo)"
            value={form.target_weight_kg}
            onChange={v => setForm(f => ({ ...f, target_weight_kg: v }))}
            min={0}
            max={999}
            step={2.5}
            decimals={1}
          />
          <NumberInput
            label="Descanso (segundos)"
            value={form.rest_seconds}
            onChange={v => setForm(f => ({ ...f, rest_seconds: v }))}
            min={15}
            max={600}
            step={15}
          />
          <Input
            label="Notas (opcional)"
            value={form.notes}
            onChangeText={v => setForm(f => ({ ...f, notes: v }))}
            placeholder="Ej: Agarre cerrado, codos a 45°"
            multiline
          />

          {/* Category picker — only shown when categories exist */}
          {categories.length > 0 && (
            <View style={styles.categoryPickerContainer}>
              <Text style={[styles.categoryPickerLabel, { color: colors.primary }]}>CATEGORÍA</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChipRow}
              >
                <Pressable
                  onPress={() => setForm(f => ({ ...f, category_id: null }))}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.border },
                    form.category_id == null && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: form.category_id == null ? colors.background : colors.textSecondary,
                    }}
                  >
                    Sin categoría
                  </Text>
                </Pressable>
                {categories.map(cat => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setForm(f => ({ ...f, category_id: cat.id }))}
                    style={[
                      styles.categoryChip,
                      { borderColor: colors.border },
                      form.category_id === cat.id && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: form.category_id === cat.id ? colors.background : colors.textSecondary,
                      }}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.modalActions}>
            <Button
              label="Cancelar"
              onPress={() => setShowExerciseModal(false)}
              variant="secondary"
              style={styles.modalBtn}
            />
            <Button
              label="Guardar"
              onPress={handleSaveExercise}
              loading={savingExercise}
              style={styles.modalBtn}
            />
          </View>
        </ScrollView>
      </Modal>

      {/* ── Category name modal ──────────────────────────────────────────── */}
      <Modal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        contentStyle={styles.modalContent}
      >
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
          {editingCategory ? 'Renombrar categoría' : 'Nueva categoría'}
        </Text>
        <Input
          label="Nombre de la categoría"
          value={categoryName}
          onChangeText={v => {
            setCategoryName(v);
            setCategoryNameError('');
          }}
          placeholder="Ej: Pecho, Hombros, Tríceps…"
          error={categoryNameError}
        />
        <View style={styles.modalActions}>
          <Button
            label="Cancelar"
            onPress={() => setShowCategoryModal(false)}
            variant="secondary"
            style={styles.modalBtn}
          />
          <Button
            label="Guardar"
            onPress={handleSaveCategory}
            loading={savingCategory}
            style={styles.modalBtn}
          />
        </View>
      </Modal>

      {/* ── Delete exercise confirmation ─────────────────────────────────── */}
      <ConfirmModal
        visible={deleteTarget !== null}
        title="¿Eliminar ejercicio?"
        message={`Se eliminará "${deleteTarget?.name}" y su historial de series en esta rutina.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteExercise}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Delete category confirmation ─────────────────────────────────── */}
      <ConfirmModal
        visible={deleteCategoryTarget !== null}
        title="¿Eliminar categoría?"
        message={`Se eliminará la categoría "${deleteCategoryTarget?.name}". Los ejercicios que pertenecían a ella quedarán sin categoría.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteCategoryTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[3],
  },
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  restRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  modalContent: {
    maxHeight: '90%',
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
  categoryPickerContainer: {
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  categoryPickerLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.5,
    marginBottom: Spacing[2],
  },
  categoryChipRow: {
    gap: 8,
    paddingBottom: Spacing[1],
  },
  categoryChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
  },
});
