import { create } from 'zustand';
import type { RoutineTemplate } from '@/constants/routineTemplates';
import { routineRepository } from '@/repositories/RoutineRepository';
import { exerciseRepository } from '@/repositories/ExerciseRepository';
import { exerciseCategoryRepository } from '@/repositories/ExerciseCategoryRepository';
import { workoutSessionRepository } from '@/repositories/WorkoutSessionRepository';
import { setLogRepository } from '@/repositories/SetLogRepository';
import { getWeekAndYear, getWeekStart, fromTimestamp } from '@/utils/dateUtils';
import type { RoutineRow, RoutineDayRow, WorkoutSessionRow, ExerciseRow, SetLogRow, ExerciseCategoryRow } from '@/types/database.types';
import type { UpdateDayInput } from '@/repositories/RoutineRepository';
import type { CreateExerciseInput, UpdateExerciseInput } from '@/repositories/ExerciseRepository';
import type { CreateSetLogInput, UpdateSetLogInput } from '@/repositories/SetLogRepository';

interface WorkoutState {
  // Rutina activa y sus días (ordenados por day_of_week 1–7)
  activeRoutine: RoutineRow | null;
  routineDays: RoutineDayRow[];
  // Cantidad de ejercicios por día (dayId → count); se carga junto con routineDays
  exerciseCounts: Record<number, number>;
  // Todas las rutinas para RoutineManagerScreen
  allRoutines: RoutineRow[];
  // Desplazamiento de semana: 0 = actual, -1 = anterior, 1 = siguiente
  weekOffset: number;
  // Sesiones de la semana seleccionada
  weekSessions: WorkoutSessionRow[];
  // Totales de la semana seleccionada (series y volumen real)
  weekTotalSets: number;
  weekTotalVolume: number;
  isLoading: boolean;
  // Sesión activa en curso (null si no hay entrenamiento activo)
  activeSession: WorkoutSessionRow | null;
  // Ejercicios del día de la sesión activa
  activeExercises: ExerciseRow[];
  // Sets registrados en la sesión activa
  activeSetLogs: SetLogRow[];

  loadActiveRoutine: () => Promise<void>;
  loadAllRoutines: () => Promise<void>;
  loadWeekSessions: (offset?: number) => Promise<void>;
  setWeekOffset: (offset: number) => Promise<void>;
  createRoutine: (name: string) => Promise<void>;
  setActiveRoutine: (id: number) => Promise<void>;
  deleteRoutine: (id: number) => Promise<void>;
  renameRoutine: (id: number, name: string) => Promise<void>;
  updateDay: (dayId: number, input: UpdateDayInput) => Promise<RoutineDayRow>;
  getDayExercises: (dayId: number) => Promise<ExerciseRow[]>;
  getSessionExercises: (sessionId: number) => Promise<ExerciseRow[]>;
  getCompletedSessionForDay: (routineDayId: number, date: number) => Promise<WorkoutSessionRow | null>;
  addExercise: (input: CreateExerciseInput) => Promise<ExerciseRow>;
  updateExercise: (id: number, input: UpdateExerciseInput) => Promise<ExerciseRow>;
  deleteExercise: (id: number, dayId: number) => Promise<void>;
  reorderExercises: (orderedIds: number[], dayId: number) => Promise<void>;
  startSession: (routineDayId: number, date: number) => Promise<WorkoutSessionRow>;
  loadSession: (sessionId: number) => Promise<void>;
  finishSession: (sessionId: number) => Promise<void>;
  abandonSession: (sessionId: number) => Promise<void>;
  deleteSession: (sessionId: number) => Promise<void>;
  reopenSession: (sessionId: number) => Promise<WorkoutSessionRow>;
  getPreviousSessionSets: (routineDayId: number, currentSessionId: number) => Promise<SetLogRow[]>;
  logSet: (input: CreateSetLogInput) => Promise<SetLogRow>;
  updateSet: (id: number, input: UpdateSetLogInput) => Promise<void>;
  deleteSet: (id: number) => Promise<void>;
  getDayCategories: (routineDayId: number) => Promise<ExerciseCategoryRow[]>;
  addCategory: (routineDayId: number, name: string) => Promise<ExerciseCategoryRow>;
  renameCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  setExerciseCategory: (exerciseId: number, categoryId: number | null) => Promise<void>;
  createRoutineFromTemplate: (template: RoutineTemplate) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  activeRoutine: null,
  routineDays: [],
  exerciseCounts: {},
  allRoutines: [],
  weekOffset: 0,
  weekSessions: [],
  weekTotalSets: 0,
  weekTotalVolume: 0,
  isLoading: false,
  activeSession: null,
  activeExercises: [],
  activeSetLogs: [],

  // Carga la rutina activa, sus 7 días y los conteos de ejercicios por día
  loadActiveRoutine: async () => {
    set({ isLoading: true });
    try {
      const routine = await routineRepository.getActive();
      if (routine) {
        const days = await routineRepository.getDaysForRoutine(routine.id);
        const counts: Record<number, number> = {};
        for (const day of days) {
          if (day.is_rest_day !== 1) {
            const exercises = await exerciseRepository.getByDay(day.id);
            counts[day.id] = exercises.length;
          } else {
            counts[day.id] = 0;
          }
        }
        set({ activeRoutine: routine, routineDays: days, exerciseCounts: counts });
      } else {
        set({ activeRoutine: null, routineDays: [], exerciseCounts: {} });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Carga todas las rutinas para el gestor de rutinas
  loadAllRoutines: async () => {
    const routines = await routineRepository.getAll();
    set({ allRoutines: routines });
  },

  // Carga las sesiones de la semana en el offset dado (0 = actual, -1 = anterior)
  loadWeekSessions: async (offset) => {
    const weekOffset = offset ?? get().weekOffset;
    const weekStart = getWeekStart(weekOffset);
    const { weekNumber, year } = getWeekAndYear(weekStart);
    const sessions = await workoutSessionRepository.getByWeek(year, weekNumber);
    const finishedIds = sessions.filter(s => s.finished_at != null).map(s => s.id);
    let weekTotalSets = 0;
    let weekTotalVolume = 0;
    if (finishedIds.length > 0) {
      try {
        const agg = await setLogRepository.getWeekAggregates(finishedIds);
        weekTotalSets = agg.totalSets;
        weekTotalVolume = agg.totalVolumeKg;
      } catch {
        // Si la consulta de agregados falla, los totales quedan en 0
      }
    }
    set({ weekSessions: sessions, weekTotalSets, weekTotalVolume });
  },

  // Cambia el offset de semana y recarga las sesiones
  setWeekOffset: async (offset) => {
    set({ weekOffset: offset });
    await get().loadWeekSessions(offset);
  },

  // Crea una nueva rutina con 7 días vacíos y la activa
  createRoutine: async (name) => {
    const routine = await routineRepository.create({ name });
    const days = await routineRepository.getDaysForRoutine(routine.id);
    const counts: Record<number, number> = {};
    for (const day of days) {
      counts[day.id] = 0;
    }
    const allRoutines = await routineRepository.getAll();
    set({ activeRoutine: routine, routineDays: days, exerciseCounts: counts, allRoutines });
  },

  // Activa una rutina existente y carga sus días
  setActiveRoutine: async (id) => {
    await routineRepository.setActive(id);
    const routine = await routineRepository.getActive();
    if (routine) {
      const days = await routineRepository.getDaysForRoutine(routine.id);
      const counts: Record<number, number> = {};
      for (const day of days) {
        if (day.is_rest_day !== 1) {
          const exercises = await exerciseRepository.getByDay(day.id);
          counts[day.id] = exercises.length;
        } else {
          counts[day.id] = 0;
        }
      }
      const allRoutines = await routineRepository.getAll();
      set({ activeRoutine: routine, routineDays: days, exerciseCounts: counts, allRoutines });
    }
  },

  // Elimina una rutina y actualiza estado (si era activa, activa la siguiente disponible)
  deleteRoutine: async (id) => {
    await routineRepository.delete(id);
    const { activeRoutine } = get();
    const remaining = await routineRepository.getAll();
    if (activeRoutine?.id === id) {
      if (remaining.length > 0) {
        await routineRepository.setActive(remaining[0].id);
        const newActive = await routineRepository.getActive();
        if (newActive) {
          const days = await routineRepository.getDaysForRoutine(newActive.id);
          const counts: Record<number, number> = {};
          for (const day of days) {
            if (day.is_rest_day !== 1) {
              const exercises = await exerciseRepository.getByDay(day.id);
              counts[day.id] = exercises.length;
            } else {
              counts[day.id] = 0;
            }
          }
          set({ activeRoutine: newActive, routineDays: days, exerciseCounts: counts, allRoutines: remaining });
        }
      } else {
        set({ activeRoutine: null, routineDays: [], exerciseCounts: {}, allRoutines: [] });
      }
    } else {
      set({ allRoutines: remaining });
    }
  },

  // Renombra una rutina y actualiza listas
  renameRoutine: async (id, name) => {
    await routineRepository.rename(id, name);
    const allRoutines = await routineRepository.getAll();
    const { activeRoutine } = get();
    const updatedActive = activeRoutine?.id === id
      ? allRoutines.find(r => r.id === id) ?? activeRoutine
      : activeRoutine;
    set({ allRoutines, activeRoutine: updatedActive ?? null });
  },

  // Actualiza nombre o estado de descanso de un día de rutina
  updateDay: async (dayId, input) => {
    const updated = await routineRepository.updateDay(dayId, input);
    set(state => ({
      routineDays: state.routineDays.map(d => d.id === dayId ? updated : d),
    }));
    return updated;
  },

  // Devuelve los ejercicios de un día (para EditDayScreen y carga bajo demanda)
  getDayExercises: async (dayId) => {
    return exerciseRepository.getByDay(dayId);
  },

  // Devuelve los ejercicios de una sesión completada; genera placeholders para ejercicios eliminados antes del soft-delete
  getSessionExercises: async (sessionId) => {
    const setLogs = await setLogRepository.getBySession(sessionId);
    const exerciseIds = [...new Set(setLogs.map(s => s.exercise_id))];
    if (exerciseIds.length === 0) return [];
    const found = await exerciseRepository.getByIds(exerciseIds);
    const foundMap = new Map(found.map(e => [e.id, e]));
    return exerciseIds.map(id => foundMap.get(id) ?? {
      id, routine_day_id: 0, name: 'Ejercicio eliminado',
      target_sets: 0, target_reps: 0, target_weight_kg: 0, rest_seconds: 0,
      notes: null, sort_order: id, category_id: null,
      is_deleted: 1 as 0 | 1, created_at: 0, updated_at: 0,
    });
  },

  // Devuelve la sesión (completada o en curso) para un día concreto directamente desde DB
  getCompletedSessionForDay: async (routineDayId, date) => {
    return workoutSessionRepository.getByDayAndDate(routineDayId, date);
  },

  // Añade un ejercicio a un día y actualiza el contador
  addExercise: async (input) => {
    const exercise = await exerciseRepository.create(input);
    set(state => ({
      exerciseCounts: {
        ...state.exerciseCounts,
        [input.routine_day_id]: (state.exerciseCounts[input.routine_day_id] ?? 0) + 1,
      },
    }));
    return exercise;
  },

  // Actualiza los campos de un ejercicio
  updateExercise: async (id, input) => {
    return exerciseRepository.update(id, input);
  },

  // Elimina un ejercicio y actualiza el contador del día
  deleteExercise: async (id, dayId) => {
    await exerciseRepository.delete(id);
    set(state => ({
      exerciseCounts: {
        ...state.exerciseCounts,
        [dayId]: Math.max(0, (state.exerciseCounts[dayId] ?? 1) - 1),
      },
    }));
  },

  // Reordena ejercicios y actualiza el contador del día
  reorderExercises: async (orderedIds, dayId) => {
    await exerciseRepository.reorder(orderedIds);
    set(state => ({
      exerciseCounts: {
        ...state.exerciseCounts,
        [dayId]: orderedIds.length,
      },
    }));
  },

  // Crea una sesión nueva para un día concreto y carga los ejercicios del día
  startSession: async (routineDayId, date) => {
    const dateObj = fromTimestamp(date);
    const { weekNumber, year } = getWeekAndYear(dateObj);
    const session = await workoutSessionRepository.create({
      routine_day_id: routineDayId,
      date,
      week_number: weekNumber,
      year,
    });
    const exercises = await exerciseRepository.getByDay(routineDayId);
    set({ activeSession: session, activeExercises: exercises, activeSetLogs: [] });
    return session;
  },

  // Carga una sesión existente con sus ejercicios y sets (para reanudar o ver resumen).
  // Incluye ejercicios eliminados que tengan sets en esta sesión para preservar el historial.
  loadSession: async (sessionId) => {
    const session = await workoutSessionRepository.getById(sessionId);
    if (!session) return;
    const dayExercises = await exerciseRepository.getByDay(session.routine_day_id);
    const setLogs = await setLogRepository.getBySession(sessionId);
    const loggedIds = [...new Set(setLogs.map(s => s.exercise_id))];
    const missingIds = loggedIds.filter(id => !dayExercises.find(e => e.id === id));
    let historicalExercises: ExerciseRow[] = [];
    if (missingIds.length > 0) {
      const found = await exerciseRepository.getByIds(missingIds);
      const foundMap = new Map(found.map(e => [e.id, e]));
      historicalExercises = missingIds.map(id => foundMap.get(id) ?? {
        id, routine_day_id: 0, name: 'Ejercicio eliminado',
        target_sets: 0, target_reps: 0, target_weight_kg: 0, rest_seconds: 0,
        notes: null, sort_order: id, category_id: null,
        is_deleted: 1 as 0 | 1, created_at: 0, updated_at: 0,
      });
    }
    const exercises = [...dayExercises, ...historicalExercises]
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    set({ activeSession: session, activeExercises: exercises, activeSetLogs: setLogs });
  },

  // Marca la sesión activa como finalizada y recarga las sesiones de la semana
  finishSession: async (sessionId) => {
    const finished = await workoutSessionRepository.finish(sessionId);
    set({ activeSession: finished });
    await get().loadWeekSessions();
  },

  // Elimina una sesión sin finalizar (abandono) y la quita del estado
  abandonSession: async (sessionId) => {
    await workoutSessionRepository.delete(sessionId);
    set(state => ({
      weekSessions: state.weekSessions.filter(s => s.id !== sessionId),
      activeSession: null,
      activeSetLogs: [],
    }));
  },

  // Elimina una sesión ya finalizada (borrar entrenamiento histórico)
  deleteSession: async (sessionId) => {
    await workoutSessionRepository.delete(sessionId);
    set(state => ({
      weekSessions: state.weekSessions.filter(s => s.id !== sessionId),
      activeSession: state.activeSession?.id === sessionId ? null : state.activeSession,
      activeSetLogs: state.activeSession?.id === sessionId ? [] : state.activeSetLogs,
    }));
  },

  // Reabre una sesión finalizada para seguir editando
  reopenSession: async (sessionId) => {
    const session = await workoutSessionRepository.reopen(sessionId);
    set(state => ({
      weekSessions: state.weekSessions.map(s => s.id === sessionId ? session : s),
      activeSession: session,
    }));
    return session;
  },

  // Devuelve los set_logs de la sesión anterior (para comparativa en resumen)
  getPreviousSessionSets: async (routineDayId, currentSessionId) => {
    const sessions = await workoutSessionRepository.getRecentByDay(routineDayId, 5);
    const prev = sessions.find(s => s.id !== currentSessionId && s.finished_at != null);
    if (!prev) return [];
    return setLogRepository.getBySession(prev.id);
  },

  // Registra un set en tiempo real durante el entrenamiento
  logSet: async (input) => {
    const setLog = await setLogRepository.create(input);
    set(state => ({ activeSetLogs: [...state.activeSetLogs, setLog] }));
    return setLog;
  },

  // Actualiza peso/reps de un set ya registrado
  updateSet: async (id, input) => {
    const updated = await setLogRepository.update(id, input);
    set(state => ({
      activeSetLogs: state.activeSetLogs.map(s => s.id === id ? updated : s),
    }));
  },

  // Elimina un set registrado
  deleteSet: async (id) => {
    await setLogRepository.delete(id);
    set(state => ({
      activeSetLogs: state.activeSetLogs.filter(s => s.id !== id),
    }));
  },

  // Devuelve las categorías de un día (para EditDayScreen y ActiveWorkoutScreen)
  getDayCategories: async (routineDayId) => {
    return exerciseCategoryRepository.getByDay(routineDayId);
  },

  // Crea una nueva categoría para un día
  addCategory: async (routineDayId, name) => {
    return exerciseCategoryRepository.create(routineDayId, name);
  },

  // Renombra una categoría existente
  renameCategory: async (id, name) => {
    await exerciseCategoryRepository.rename(id, name);
  },

  // Elimina una categoría (los ejercicios quedan sin categoría via ON DELETE SET NULL)
  deleteCategory: async (id) => {
    await exerciseCategoryRepository.delete(id);
  },

  // Asigna o quita la categoría de un ejercicio
  setExerciseCategory: async (exerciseId, categoryId) => {
    await exerciseRepository.setCategory(exerciseId, categoryId);
  },

  // Crea una rutina completa desde una plantilla predefinida y recarga el estado activo
  createRoutineFromTemplate: async (template) => {
    await routineRepository.createFromTemplate(template.name, template.days);
    await get().loadActiveRoutine();
  },
}));
