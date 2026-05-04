import type {
  ProfileRow,
  BodyWeightRow,
  WorkoutSessionRow,
  SetLogRow,
  WeightGoalRow,
  BodyMeasurementRow,
  WeeklyPlanRow,
} from '@/types/database.types';

export interface PlanningInput {
  profile: ProfileRow;
  weightGoal: WeightGoalRow | null;
  recentWeights: BodyWeightRow[];       // Últimas 4 semanas
  recentSessions: WorkoutSessionRow[];  // Últimas 4 semanas (solo finalizadas)
  recentSetLogs: SetLogRow[];           // De esas sesiones
  lastMeasurement: BodyMeasurementRow | null;
  previousPlan: WeeklyPlanRow | null;
  currentWeekNumber: number;
  currentYear: number;
}

export interface WeeklyMetrics {
  // Adherencia respecto a los días disponibles del perfil
  adherenceRate: number;
  missedSessionsCount: number;
  consecutiveWeeksGoodAdherence: number;

  // Peso
  currentWeightKg: number | null;
  weightTrend: 'losing' | 'gaining' | 'stable' | 'no_data';
  weeklyWeightChangeKg: number;
  requiredWeeklyChangeKg: number;
  daysUntilGoal: number;
  isOnTrackForGoal: boolean;
  weightGoal: WeightGoalRow | null;

  // Volumen de entrenamiento (última semana vs anterior)
  averageVolumeLastWeek: number;
  averageVolumeWeekBefore: number;
  volumeChangePercent: number;
  hasStagnation: boolean;   // Sin cambio en volumen por 2+ semanas
  hasOvertraining: boolean; // Volumen aumentó >15% en una semana

  // Calidad de datos: 'good' ≥3 semanas, 'limited' 1-2, 'insufficient' <1
  dataQuality: 'good' | 'limited' | 'insufficient';
}

function computeVolumeForSessions(
  sessions: WorkoutSessionRow[],
  setLogs: SetLogRow[],
): number {
  const ids = new Set(sessions.map(s => s.id));
  return setLogs
    .filter(l => ids.has(l.workout_session_id) && l.is_warmup === 0)
    .reduce((sum, l) => sum + l.weight_kg * l.reps_done, 0);
}

// Calcula todas las métricas necesarias para el motor de planning
export function analyzeWeeklyData(input: PlanningInput): WeeklyMetrics {
  const { profile, weightGoal, recentWeights, recentSessions, recentSetLogs } = input;
  const now = Math.floor(Date.now() / 1000);
  const oneWeekAgo = now - 7 * 86400;
  const twoWeeksAgo = now - 14 * 86400;
  const fourWeeksAgo = now - 28 * 86400;

  // ── Adherencia ────────────────────────────────────────────────────────────
  const completedCount = recentSessions.length;
  // Semanas completas en el período (mín 1 para no dividir por 0)
  const weeksInWindow = Math.max(1, Math.round((now - fourWeeksAgo) / (7 * 86400)));
  const sessionsPlanned = profile.available_days * weeksInWindow;
  const adherenceRate = Math.min(1, completedCount / Math.max(sessionsPlanned, 1));
  const missedSessionsCount = Math.max(0, sessionsPlanned - completedCount);

  // Adherencia semanal por las últimas 4 semanas para calcular racha
  const weeklyAdherence: boolean[] = [];
  for (let w = 0; w < 4; w++) {
    const wStart = now - (w + 1) * 7 * 86400;
    const wEnd = now - w * 7 * 86400;
    const wSessions = recentSessions.filter(s => s.date >= wStart && s.date < wEnd).length;
    weeklyAdherence.push(wSessions / Math.max(profile.available_days, 1) >= 0.8);
  }
  let consecutiveWeeksGoodAdherence = 0;
  for (const ok of weeklyAdherence) {
    if (ok) consecutiveWeeksGoodAdherence++;
    else break;
  }

  // ── Peso ─────────────────────────────────────────────────────────────────
  const sortedWeights = [...recentWeights].sort((a, b) => a.date - b.date);
  const currentWeightKg = sortedWeights.length > 0
    ? sortedWeights[sortedWeights.length - 1].weight_kg
    : null;

  let weightTrend: WeeklyMetrics['weightTrend'] = 'no_data';
  let weeklyWeightChangeKg = 0;

  if (sortedWeights.length >= 2) {
    const oldest = sortedWeights[0];
    const newest = sortedWeights[sortedWeights.length - 1];
    const daysDiff = Math.max(1, (newest.date - oldest.date) / 86400);
    weeklyWeightChangeKg = ((newest.weight_kg - oldest.weight_kg) / daysDiff) * 7;

    if (weeklyWeightChangeKg < -0.1) weightTrend = 'losing';
    else if (weeklyWeightChangeKg > 0.1) weightTrend = 'gaining';
    else weightTrend = 'stable';
  }

  let requiredWeeklyChangeKg = 0;
  let daysUntilGoal = 0;
  let isOnTrackForGoal = false;

  if (weightGoal && currentWeightKg !== null) {
    daysUntilGoal = Math.max(0, Math.round((weightGoal.target_date - now) / 86400));
    const weeksRemaining = Math.max(1, daysUntilGoal / 7);
    requiredWeeklyChangeKg = (weightGoal.target_weight_kg - currentWeightKg) / weeksRemaining;

    if (Math.abs(requiredWeeklyChangeKg) < 0.05) {
      isOnTrackForGoal = Math.abs(weeklyWeightChangeKg) < 0.3;
    } else if (requiredWeeklyChangeKg < 0) {
      isOnTrackForGoal = weeklyWeightChangeKg <= requiredWeeklyChangeKg * 0.5;
    } else {
      isOnTrackForGoal = weeklyWeightChangeKg >= requiredWeeklyChangeKg * 0.5;
    }
  }

  // ── Volumen de entrenamiento ─────────────────────────────────────────────
  const lastWeekSessions = recentSessions.filter(s => s.date >= oneWeekAgo);
  const weekBeforeSessions = recentSessions.filter(s => s.date >= twoWeeksAgo && s.date < oneWeekAgo);

  const averageVolumeLastWeek = computeVolumeForSessions(lastWeekSessions, recentSetLogs);
  const averageVolumeWeekBefore = computeVolumeForSessions(weekBeforeSessions, recentSetLogs);

  let volumeChangePercent = 0;
  if (averageVolumeWeekBefore > 0) {
    volumeChangePercent = ((averageVolumeLastWeek - averageVolumeWeekBefore) / averageVolumeWeekBefore) * 100;
  }

  const hasStagnation =
    averageVolumeWeekBefore > 0 &&
    Math.abs(volumeChangePercent) < 5 &&
    recentSessions.filter(s => s.date >= twoWeeksAgo).length >= 2;

  const hasOvertraining = volumeChangePercent > 15 && averageVolumeLastWeek > 0;

  // ── Calidad de datos ─────────────────────────────────────────────────────
  const weeksWithSessions = new Set(recentSessions.map(s => `${s.year}-${s.week_number}`)).size;
  const dataQuality: WeeklyMetrics['dataQuality'] =
    weeksWithSessions >= 3 ? 'good' : weeksWithSessions >= 1 ? 'limited' : 'insufficient';

  return {
    adherenceRate,
    missedSessionsCount,
    consecutiveWeeksGoodAdherence,
    currentWeightKg,
    weightTrend,
    weeklyWeightChangeKg,
    requiredWeeklyChangeKg,
    daysUntilGoal,
    isOnTrackForGoal,
    weightGoal,
    averageVolumeLastWeek,
    averageVolumeWeekBefore,
    volumeChangePercent,
    hasStagnation,
    hasOvertraining,
    dataQuality,
  };
}
