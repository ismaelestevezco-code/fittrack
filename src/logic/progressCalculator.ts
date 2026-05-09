import type { SetLogRow, WorkoutSessionRow } from '@/types/database.types';
import type { ExerciseProgressPoint } from '@/types/domain.types';

// Agrupa set_logs por sesión y calcula métricas de progreso para un ejercicio
export function calculateExerciseProgress(
  setLogs: SetLogRow[],
  sessions: WorkoutSessionRow[],
): ExerciseProgressPoint[] {
  const sessionMap = new Map<number, WorkoutSessionRow>(sessions.map(s => [s.id, s]));

  const bySession = new Map<number, SetLogRow[]>();
  for (const log of setLogs) {
    const arr = bySession.get(log.workout_session_id) ?? [];
    arr.push(log);
    bySession.set(log.workout_session_id, arr);
  }

  const points: ExerciseProgressPoint[] = [];
  for (const [sessionId, logs] of bySession) {
    const session = sessionMap.get(sessionId);
    if (!session || session.finished_at == null) continue;

    const workingSets = logs.filter(l => l.is_warmup === 0);
    if (workingSets.length === 0) continue;

    points.push({
      date: session.date,
      maxWeightKg: Math.max(...workingSets.map(l => l.weight_kg)),
      totalVolumeKg: workingSets.reduce((sum, l) => sum + l.weight_kg * l.reps_done, 0),
      totalReps: workingSets.reduce((sum, l) => sum + l.reps_done, 0),
      estimatedOneRM: getMax1RMFromSets(workingSets),
    });
  }

  return points.sort((a, b) => a.date - b.date);
}

// Calcula el volumen total (sin series de calentamiento) de un array de sets
export function calculateTotalVolume(setLogs: SetLogRow[]): number {
  return setLogs
    .filter(l => l.is_warmup === 0)
    .reduce((sum, l) => sum + l.weight_kg * l.reps_done, 0);
}

export interface WeekData {
  weekNumber: number;
  year: number;
  sessionsCompleted: number;
  totalVolumeKg: number;
}

// Estima el 1RM con la fórmula de Brzycki (válida para ≥1 rep y peso > 0)
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg / (1.0278 - 0.0278 * reps);
}

// Devuelve el mayor 1RM estimado de un conjunto de sets de una sesión
export function getMax1RMFromSets(sets: SetLogRow[]): number {
  const working = sets.filter(s => s.is_warmup === 0 && s.weight_kg > 0 && s.reps_done > 0);
  if (working.length === 0) return 0;
  return Math.max(...working.map(s => estimateOneRepMax(s.weight_kg, s.reps_done)));
}

// Agrega sesiones por semana ISO y calcula el volumen total de cada semana
export function calculateWeeklyData(
  sessions: WorkoutSessionRow[],
  setLogs: SetLogRow[],
): WeekData[] {
  const volumeBySession = new Map<number, number>();
  for (const log of setLogs) {
    if (log.is_warmup === 1) continue;
    volumeBySession.set(
      log.workout_session_id,
      (volumeBySession.get(log.workout_session_id) ?? 0) + log.weight_kg * log.reps_done,
    );
  }

  const weekMap = new Map<string, WeekData>();
  for (const session of sessions) {
    if (session.finished_at == null) continue;
    const key = `${session.year}-${String(session.week_number).padStart(2, '0')}`;
    const existing = weekMap.get(key) ?? {
      weekNumber: session.week_number,
      year: session.year,
      sessionsCompleted: 0,
      totalVolumeKg: 0,
    };
    existing.sessionsCompleted += 1;
    existing.totalVolumeKg += volumeBySession.get(session.id) ?? 0;
    weekMap.set(key, existing);
  }

  return [...weekMap.values()].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.weekNumber - b.weekNumber,
  );
}
