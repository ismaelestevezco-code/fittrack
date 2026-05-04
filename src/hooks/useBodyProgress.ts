import { useBodyStore } from '@/stores/bodyStore';
import { useProfileStore } from '@/stores/profileStore';

export interface BodyProgress {
  currentWeight: number | null;
  goalWeight: number | null;
  initialWeight: number | null;
  // currentWeight - goalWeight; negativo = aún por perder, positivo = por ganar
  weightDiff: number | null;
  // 0–100: progreso desde el peso inicial hacia el objetivo
  progressPercent: number | null;
  // Cambio promedio en kg/semana basado en los datos recientes (negativo = pérdida)
  weeklyRate: number | null;
  // kg/semana necesarios para alcanzar el objetivo en la fecha límite
  requiredRate: number | null;
  daysUntilGoal: number | null;
  isOnTrack: boolean | null;
  // true si hay al menos 2 registros de peso en los últimos 90 días
  hasEnoughData: boolean;
}

export function useBodyProgress(): BodyProgress {
  const { recentWeights, weightGoal } = useBodyStore();
  const { profile } = useProfileStore();

  const sorted = [...recentWeights].sort((a, b) => a.date - b.date);

  const currentWeight = sorted.length > 0 ? sorted[sorted.length - 1].weight_kg : null;
  const goalWeight = weightGoal?.target_weight_kg ?? null;
  const initialWeight = profile?.initial_weight_kg ?? null;
  const hasEnoughData = sorted.length >= 2;

  // Tasa semanal: cambio entre el primer y último registro reciente
  let weeklyRate: number | null = null;
  if (hasEnoughData) {
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    const daysDiff = (newest.date - oldest.date) / 86400;
    if (daysDiff >= 1) {
      weeklyRate = ((newest.weight_kg - oldest.weight_kg) / daysDiff) * 7;
    }
  }

  // Días restantes hasta el objetivo
  let daysUntilGoal: number | null = null;
  if (weightGoal) {
    const now = Math.floor(Date.now() / 1000);
    daysUntilGoal = Math.max(0, Math.round((weightGoal.target_date - now) / 86400));
  }

  // Tasa necesaria para llegar al objetivo a tiempo
  let requiredRate: number | null = null;
  if (currentWeight !== null && goalWeight !== null && daysUntilGoal !== null && daysUntilGoal > 0) {
    const weeksRemaining = daysUntilGoal / 7;
    requiredRate = (goalWeight - currentWeight) / weeksRemaining;
  }

  // Diferencia con el objetivo (negativo = aún queda camino)
  const weightDiff =
    currentWeight !== null && goalWeight !== null ? currentWeight - goalWeight : null;

  // Porcentaje de progreso desde el peso inicial
  let progressPercent: number | null = null;
  if (currentWeight !== null && goalWeight !== null && initialWeight !== null) {
    const totalChange = goalWeight - initialWeight;
    if (Math.abs(totalChange) > 0.01) {
      const achieved = currentWeight - initialWeight;
      progressPercent = Math.min(100, Math.max(0, (achieved / totalChange) * 100));
    } else {
      progressPercent = 100;
    }
  }

  // ¿Va bien encaminado? La dirección del ritmo actual debe coincidir con el necesario
  let isOnTrack: boolean | null = null;
  if (weeklyRate !== null && requiredRate !== null) {
    if (Math.abs(requiredRate) < 0.05) {
      // Mantenimiento: cualquier cambio menor a 0.3 kg/semana está bien
      isOnTrack = Math.abs(weeklyRate) < 0.3;
    } else if (requiredRate < 0) {
      // Perder peso: el ritmo actual debe ser al menos el 50% del requerido
      isOnTrack = weeklyRate <= requiredRate * 0.5;
    } else {
      // Ganar peso: el ritmo actual debe ser al menos el 50% del requerido
      isOnTrack = weeklyRate >= requiredRate * 0.5;
    }
  }

  return {
    currentWeight,
    goalWeight,
    initialWeight,
    weightDiff,
    progressPercent,
    weeklyRate,
    requiredRate,
    daysUntilGoal,
    isOnTrack,
    hasEnoughData,
  };
}
