import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SetRow } from '@/components/workout/SetRow';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/context/ThemeContext';
import { formatDuration } from '@/utils/dateUtils';
import { Layout, Spacing, Typography } from '@/constants/theme';
import type { WorkoutStackParamList } from '@/types/navigation.types';
import type { ExerciseCategoryRow, ExerciseRow, SetLogRow } from '@/types/database.types';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ActiveWorkout'>;

// ─── Collapsible category section ────────────────────────────────────────────

interface CollapsibleCategorySectionProps {
  title: string | null;
  exercises: ExerciseRow[];
  extraSets: Record<number, number>;
  getLogsForExercise: (exerciseId: number) => SetLogRow[];
  onLog: (exercise: ExerciseRow, setNumber: number, reps: number, weight: number) => void;
  onUpdate: (setLogId: number, reps: number, weight: number) => void;
  onDelete: (setLogId: number) => void;
  onAddSet: (exerciseId: number) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function CollapsibleCategorySection({
  title,
  exercises,
  extraSets,
  getLogsForExercise,
  onLog,
  onUpdate,
  onDelete,
  onAddSet,
  colors,
}: CollapsibleCategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View style={{ marginBottom: title != null ? Spacing[2] : 0 }}>
      {/* Category header — only shown when there is a named category */}
      {title != null && (
        <Pressable
          onPress={() => setCollapsed(c => !c)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: Spacing[2],
            paddingHorizontal: Spacing[3],
            backgroundColor: `${colors.primary}14`,
            borderRadius: Layout.borderRadius.sm,
            marginBottom: collapsed ? 0 : Spacing[2],
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: Typography.fontSize.sm,
              fontWeight: Typography.fontWeight.semibold,
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            {title}
          </Text>
          <MaterialCommunityIcons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={18}
            color={colors.primary}
          />
        </Pressable>
      )}

      {/* Exercise blocks */}
      {!collapsed &&
        exercises.map(exercise => {
          const logs = getLogsForExercise(exercise.id);
          const totalSets = exercise.target_sets + (extraSets[exercise.id] ?? 0);

          return (
            <View key={exercise.id} style={styles.exerciseBlock}>
              <SectionHeader title={exercise.name} />

              <View style={styles.targetInfo}>
                <MaterialCommunityIcons name="bullseye-arrow" size={14} color={colors.textHint} />
                <Text style={[styles.targetText, { color: colors.textHint }]}>
                  Objetivo: {exercise.target_sets} ×{' '}
                  {exercise.target_reps > 0 ? `${exercise.target_reps} reps` : '—'}
                  {exercise.target_weight_kg > 0 ? ` · ${exercise.target_weight_kg} kg` : ''}
                </Text>
              </View>

              {Array.from({ length: totalSets }, (_, i) => {
                const setNumber = i + 1;
                const loggedSet = logs.find(l => l.set_number === setNumber);
                const prevLog = logs[i > 0 ? i - 1 : -1];
                return (
                  <SetRow
                    key={`${exercise.id}-${setNumber}`}
                    setNumber={setNumber}
                    targetReps={exercise.target_reps}
                    targetWeight={prevLog?.weight_kg ?? exercise.target_weight_kg}
                    loggedSet={loggedSet}
                    onLog={(reps, weight) => onLog(exercise, setNumber, reps, weight)}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                );
              })}

              <Pressable
                style={styles.addSetBtn}
                onPress={() => onAddSet(exercise.id)}
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                <Text style={[styles.addSetText, { color: colors.primary }]}>Añadir serie</Text>
              </Pressable>
            </View>
          );
        })}
    </View>
  );
}

// ─── Timer panel ─────────────────────────────────────────────────────────────

type TimerTab = 'session' | 'stopwatch' | 'countdown';

function pad2(n: number) { return String(Math.floor(n)).padStart(2, '0'); }

function formatStopwatch(ms: number) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  return `${pad2(min)}:${pad2(sec)},${pad2(cs)}`;
}

function formatCountdown(ms: number) {
  const totalCs = Math.max(0, Math.floor(ms / 10));
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  return `${pad2(min)}:${pad2(sec)},${pad2(cs)}`;
}

interface TimerPanelProps {
  elapsedSeconds: number;
  colors: ReturnType<typeof useTheme>['colors'];
}

function TimerPanel({ elapsedSeconds, colors }: TimerPanelProps) {
  const [tab, setTab] = useState<TimerTab>('session');

  // Stopwatch state
  const [swRunning, setSwRunning] = useState(false);
  const [swMs, setSwMs] = useState(0);
  const swRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const swStartRef = useRef(0);
  const swBaseRef = useRef(0);

  // Countdown state
  const [cdRunning, setCdRunning] = useState(false);
  const [cdMs, setCdMs] = useState(0);
  const [cdTotalMs, setCdTotalMs] = useState(90000); // default 1:30
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdStartRef = useRef(0);
  const cdBaseRef = useRef(90000);
  const [cdSetMin, setCdSetMin] = useState('1');
  const [cdSetSec, setCdSetSec] = useState('30');
  const [cdSetting, setCdSetting] = useState(false);

  // Stopwatch controls
  const swToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (swRunning) {
      if (swRef.current) clearInterval(swRef.current);
      swBaseRef.current = swMs;
      setSwRunning(false);
    } else {
      swStartRef.current = Date.now();
      swRef.current = setInterval(() => {
        setSwMs(swBaseRef.current + Date.now() - swStartRef.current);
      }, 10);
      setSwRunning(true);
    }
  }, [swRunning, swMs]);

  const swReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (swRef.current) clearInterval(swRef.current);
    swBaseRef.current = 0;
    setSwMs(0);
    setSwRunning(false);
  }, []);

  // Countdown controls
  const cdToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (cdMs <= 0) return;
    if (cdRunning) {
      if (cdRef.current) clearInterval(cdRef.current);
      cdBaseRef.current = cdMs;
      setCdRunning(false);
    } else {
      cdStartRef.current = Date.now();
      cdRef.current = setInterval(() => {
        const remaining = cdBaseRef.current - (Date.now() - cdStartRef.current);
        if (remaining <= 0) {
          if (cdRef.current) clearInterval(cdRef.current);
          setCdMs(0);
          setCdRunning(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
          setCdMs(remaining);
        }
      }, 10);
      setCdRunning(true);
    }
  }, [cdRunning, cdMs]);

  const cdReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (cdRef.current) clearInterval(cdRef.current);
    setCdMs(cdTotalMs);
    cdBaseRef.current = cdTotalMs;
    setCdRunning(false);
  }, [cdTotalMs]);

  const cdApplySet = useCallback(() => {
    const min = Math.max(0, parseInt(cdSetMin, 10) || 0);
    const sec = Math.max(0, Math.min(59, parseInt(cdSetSec, 10) || 0));
    const ms = (min * 60 + sec) * 1000;
    if (ms <= 0) return;
    if (cdRef.current) clearInterval(cdRef.current);
    setCdTotalMs(ms);
    setCdMs(ms);
    cdBaseRef.current = ms;
    setCdRunning(false);
    setCdSetting(false);
  }, [cdSetMin, cdSetSec]);

  useEffect(() => {
    return () => {
      if (swRef.current) clearInterval(swRef.current);
      if (cdRef.current) clearInterval(cdRef.current);
    };
  }, []);

  const tabs: Array<{ key: TimerTab; icon: string }> = [
    { key: 'session', icon: 'timer-outline' },
    { key: 'stopwatch', icon: 'stopwatch' },
    { key: 'countdown', icon: 'timer-sand' },
  ];

  return (
    <View style={[timerStyles.container, { backgroundColor: `${colors.primary}10`, borderBottomColor: colors.border }]}>
      {/* Tab selector */}
      <View style={timerStyles.tabs}>
        {tabs.map(t => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[
              timerStyles.tabBtn,
              { backgroundColor: tab === t.key ? `${colors.primary}20` : 'transparent' },
            ]}
          >
            <MaterialCommunityIcons
              name={t.icon as never}
              size={18}
              color={tab === t.key ? colors.primary : colors.textHint}
            />
          </Pressable>
        ))}
      </View>

      {/* Session timer */}
      {tab === 'session' && (
        <View style={timerStyles.body}>
          <Text style={[timerStyles.value, { color: colors.primary }]}>
            {formatDuration(elapsedSeconds)}
          </Text>
          <Text style={[timerStyles.label, { color: colors.textHint }]}>en progreso</Text>
        </View>
      )}

      {/* Stopwatch */}
      {tab === 'stopwatch' && (
        <View style={timerStyles.body}>
          <Text style={[timerStyles.value, { color: colors.primary }]}>
            {formatStopwatch(swMs)}
          </Text>
          <View style={timerStyles.ctrlRow}>
            <Pressable
              onPress={swToggle}
              style={[timerStyles.ctrlBtn, { backgroundColor: swRunning ? `${colors.warning}22` : `${colors.accent}22` }]}
            >
              <MaterialCommunityIcons
                name={swRunning ? 'pause' : 'play'}
                size={22}
                color={swRunning ? colors.warning : colors.accent}
              />
            </Pressable>
            <Pressable
              onPress={swReset}
              style={[timerStyles.ctrlBtn, { backgroundColor: `${colors.textHint}15` }]}
            >
              <MaterialCommunityIcons name="replay" size={20} color={colors.textHint} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Countdown */}
      {tab === 'countdown' && (
        <View style={timerStyles.body}>
          {cdSetting ? (
            <View style={timerStyles.cdSetRow}>
              <TextInput
                value={cdSetMin}
                onChangeText={setCdSetMin}
                keyboardType="number-pad"
                selectTextOnFocus
                style={[timerStyles.cdInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                maxLength={2}
              />
              <Text style={[timerStyles.cdColon, { color: colors.textPrimary }]}>:</Text>
              <TextInput
                value={cdSetSec}
                onChangeText={setCdSetSec}
                keyboardType="number-pad"
                selectTextOnFocus
                style={[timerStyles.cdInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                maxLength={2}
              />
              <Pressable
                onPress={cdApplySet}
                style={[timerStyles.ctrlBtn, { backgroundColor: `${colors.accent}22` }]}
              >
                <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable onPress={() => setCdSetting(true)}>
                <Text style={[timerStyles.value, { color: cdMs <= 0 ? colors.danger : cdMs < 10000 ? colors.warning : colors.primary }]}>
                  {formatCountdown(cdMs)}
                </Text>
              </Pressable>
              <View style={timerStyles.ctrlRow}>
                <Pressable
                  onPress={cdToggle}
                  disabled={cdMs <= 0}
                  style={[timerStyles.ctrlBtn, { backgroundColor: cdRunning ? `${colors.warning}22` : `${colors.accent}22`, opacity: cdMs <= 0 ? 0.4 : 1 }]}
                >
                  <MaterialCommunityIcons
                    name={cdRunning ? 'pause' : 'play'}
                    size={22}
                    color={cdRunning ? colors.warning : colors.accent}
                  />
                </Pressable>
                <Pressable
                  onPress={cdReset}
                  style={[timerStyles.ctrlBtn, { backgroundColor: `${colors.textHint}15` }]}
                >
                  <MaterialCommunityIcons name="replay" size={20} color={colors.textHint} />
                </Pressable>
                <Pressable
                  onPress={() => setCdSetting(true)}
                  style={[timerStyles.ctrlBtn, { backgroundColor: `${colors.textHint}15` }]}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textHint} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingTop: Spacing[2],
    paddingHorizontal: Spacing[4],
  },
  tabBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
    borderRadius: Layout.borderRadius.full,
  },
  body: {
    alignItems: 'center',
    paddingVertical: Spacing[3],
    gap: Spacing[2],
  },
  value: {
    fontSize: Typography.fontSize.timer,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: -1,
    lineHeight: 56,
  },
  label: {
    fontSize: Typography.fontSize.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ctrlRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  ctrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cdSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  cdInput: {
    width: 52,
    height: 44,
    borderRadius: Layout.inputRadius,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
  },
  cdColon: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ActiveWorkoutScreen({ navigation, route }: Props) {
  const { routineDayId: _routineDayId, sessionId, editMode = false } = route.params;
  const { colors } = useTheme();
  const {
    activeSession,
    activeExercises,
    activeSetLogs,
    loadSession,
    finishSession,
    abandonSession,
    logSet,
    updateSet,
    deleteSet,
    getDayCategories,
  } = useWorkoutStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [extraSets, setExtraSets] = useState<Record<number, number>>({});
  const [categories, setCategories] = useState<ExerciseCategoryRow[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRemoveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadSession(sessionId).then(async () => {
      // Load categories after session so we have routine_day_id
      const session = useWorkoutStore.getState().activeSession;
      if (session) {
        const cats = await getDayCategories(session.routine_day_id);
        setCategories(cats);
      }
      setLoading(false);
    });
  }, [sessionId]);

  useEffect(() => {
    if (!activeSession) return;
    const startedAt = activeSession.started_at;
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor(Date.now() / 1000) - startedAt);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeSession?.started_at]);

  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      // In editMode, allow back navigation without abandon confirmation
      if (finishing || editMode) return;
      e.preventDefault();
      pendingRemoveRef.current = () => navigation.dispatch(e.data.action);
      setShowAbandonConfirm(true);
    });
  }, [navigation, finishing, editMode]);

  const getLogsForExercise = useCallback(
    (exerciseId: number): SetLogRow[] => {
      return activeSetLogs
        .filter(s => s.exercise_id === exerciseId)
        .sort((a, b) => a.set_number - b.set_number);
    },
    [activeSetLogs],
  );

  const handleLog = useCallback(
    async (exercise: ExerciseRow, setNumber: number, reps: number, weight: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await logSet({
        workout_session_id: sessionId,
        exercise_id: exercise.id,
        set_number: setNumber,
        reps_done: reps,
        weight_kg: weight,
      });
    },
    [sessionId, logSet],
  );

  const handleUpdate = useCallback(
    async (setLogId: number, reps: number, weight: number) => {
      await updateSet(setLogId, { reps_done: reps, weight_kg: weight });
    },
    [updateSet],
  );

  const handleDelete = useCallback(
    async (setLogId: number) => {
      await deleteSet(setLogId);
    },
    [deleteSet],
  );

  const handleAddSet = useCallback((exerciseId: number) => {
    setExtraSets(prev => ({ ...prev, [exerciseId]: (prev[exerciseId] ?? 0) + 1 }));
  }, []);

  const handleFinish = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await finishSession(sessionId);
      navigation.replace('WorkoutSummary', { sessionId });
    } finally {
      setFinishing(false);
    }
  }, [finishing, sessionId, finishSession, navigation, editMode]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Build groups: categories first (only those with exercises), then uncategorized
  const hasAnyCategorized = categories.length > 0 && activeExercises.some(
    e => e.category_id != null && categories.find(c => c.id === e.category_id),
  );

  const groups: Array<{ id: string; title: string | null; exercises: ExerciseRow[] }> = hasAnyCategorized
    ? [
        ...categories
          .map(cat => ({
            id: String(cat.id),
            title: cat.name,
            exercises: activeExercises.filter(e => e.category_id === cat.id),
          }))
          .filter(g => g.exercises.length > 0),
        {
          id: 'uncategorized',
          title: null,
          exercises: activeExercises.filter(
            e => e.category_id == null || !categories.find(c => c.id === e.category_id),
          ),
        },
      ].filter(g => g.exercises.length > 0)
    : [{ id: 'all', title: null, exercises: activeExercises }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <TimerPanel elapsedSeconds={elapsedSeconds} colors={colors} />

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        {groups.map(group => (
          <CollapsibleCategorySection
            key={group.id}
            title={group.title}
            exercises={group.exercises}
            extraSets={extraSets}
            getLogsForExercise={getLogsForExercise}
            onLog={handleLog}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAddSet={handleAddSet}
            colors={colors}
          />
        ))}

        {activeExercises.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No hay ejercicios en este día.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          label={editMode ? 'Guardar cambios' : 'Finalizar entrenamiento'}
          onPress={() => setShowConfirm(true)}
          loading={finishing}
          leftIcon={
            <MaterialCommunityIcons
              name={editMode ? 'content-save-outline' : 'flag-checkered'}
              size={18}
              color={colors.background}
            />
          }
        />
      </View>

      <ConfirmModal
        visible={showConfirm}
        title={editMode ? '¿Guardar cambios?' : '¿Finalizar entrenamiento?'}
        message={editMode ? 'Se actualizará el entrenamiento con los cambios realizados.' : 'Se registrará la sesión con los sets completados hasta ahora.'}
        confirmLabel={editMode ? 'Guardar' : 'Finalizar'}
        cancelLabel="Continuar"
        onConfirm={() => {
          setShowConfirm(false);
          handleFinish();
        }}
        onCancel={() => setShowConfirm(false)}
      />

      <ConfirmModal
        visible={showAbandonConfirm}
        title="¿Abandonar entrenamiento?"
        message="Se descartará toda la sesión. La próxima vez tendrás que empezar desde cero."
        confirmLabel="Abandonar"
        cancelLabel="Continuar entrenando"
        destructive
        onConfirm={async () => {
          setShowAbandonConfirm(false);
          await abandonSession(sessionId);
          pendingRemoveRef.current?.();
          pendingRemoveRef.current = null;
        }}
        onCancel={() => {
          setShowAbandonConfirm(false);
          pendingRemoveRef.current = null;
        }}
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
    padding: Spacing[6],
  },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[6],
  },
  exerciseBlock: {
    marginBottom: Spacing[6],
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginBottom: Spacing[2],
  },
  targetText: {
    fontSize: Typography.fontSize.xs,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    alignSelf: 'flex-start',
  },
  addSetText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderTopWidth: 0.5,
  },
});
