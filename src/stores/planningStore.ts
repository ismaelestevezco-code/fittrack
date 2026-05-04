import { create } from 'zustand';
import { weeklyPlanRepository } from '@/repositories/WeeklyPlanRepository';
import { profileRepository } from '@/repositories/ProfileRepository';
import { bodyWeightRepository } from '@/repositories/BodyWeightRepository';
import { weightGoalRepository } from '@/repositories/WeightGoalRepository';
import { bodyMeasurementRepository } from '@/repositories/BodyMeasurementRepository';
import { workoutSessionRepository } from '@/repositories/WorkoutSessionRepository';
import { setLogRepository } from '@/repositories/SetLogRepository';
import { generateWeeklyPlan } from '@/logic/planningEngine';
import { getWeekAndYear } from '@/utils/dateUtils';
import type { WeeklyPlanRow } from '@/types/database.types';
import type { RecommendationItem } from '@/types/domain.types';

interface PlanningState {
  // Planning de la semana actual (null si no se ha generado)
  currentPlan: WeeklyPlanRow | null;
  // Historial de plannings anteriores, ordenado de más reciente a más antiguo
  history: WeeklyPlanRow[];
  isLoading: boolean;
  isGenerating: boolean;

  loadCurrentPlan: () => Promise<void>;
  loadHistory: () => Promise<void>;
  // Genera y guarda el planning de la semana actual usando datos reales
  generatePlan: () => Promise<void>;
}

export function parseRecommendations(plan: WeeklyPlanRow): RecommendationItem[] {
  try {
    return JSON.parse(plan.recommendations) as RecommendationItem[];
  } catch {
    return [];
  }
}

export function parseSummary(plan: WeeklyPlanRow): string {
  try {
    return JSON.parse(plan.summary) as string;
  } catch {
    return '';
  }
}

export const usePlanningStore = create<PlanningState>()((set) => ({
  currentPlan: null,
  history: [],
  isLoading: false,
  isGenerating: false,

  loadCurrentPlan: async () => {
    set({ isLoading: true });
    try {
      const { weekNumber, year } = getWeekAndYear(new Date());
      const plan = await weeklyPlanRepository.getByWeek(year, weekNumber);
      set({ currentPlan: plan });
    } finally {
      set({ isLoading: false });
    }
  },

  loadHistory: async () => {
    const all = await weeklyPlanRepository.getAll();
    const { weekNumber, year } = getWeekAndYear(new Date());
    // El historial excluye la semana actual (se muestra en currentPlan)
    const history = all.filter(
      p => !(p.year === year && p.week_number === weekNumber),
    );
    set({ history });
  },

  generatePlan: async () => {
    set({ isGenerating: true });
    try {
      const profile = await profileRepository.getFirst();
      if (!profile) return;

      const { weekNumber: currentWeekNumber, year: currentYear } = getWeekAndYear(new Date());

      // Fecha de hace 7 días para el plan anterior
      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      const { weekNumber: prevWeek, year: prevYear } = getWeekAndYear(lastWeekDate);

      const [
        recentWeights,
        weightGoal,
        recentSessions,
        measurements,
        previousPlan,
      ] = await Promise.all([
        bodyWeightRepository.getRecent(28),
        weightGoalRepository.get(),
        workoutSessionRepository.getRecentFinished(28),
        bodyMeasurementRepository.getAll(),
        weeklyPlanRepository.getByWeek(prevYear, prevWeek),
      ]);

      const sessionIds = recentSessions.map(s => s.id);
      const recentSetLogs = await setLogRepository.getBySessionIds(sessionIds);

      const lastMeasurement =
        measurements.length > 0
          ? [...measurements].sort((a, b) => b.date - a.date)[0]
          : null;

      const planData = generateWeeklyPlan({
        profile,
        weightGoal,
        recentWeights,
        recentSessions,
        recentSetLogs,
        lastMeasurement,
        previousPlan,
        currentWeekNumber,
        currentYear,
      });

      const saved = await weeklyPlanRepository.upsert(planData);
      set({ currentPlan: saved });
    } finally {
      set({ isGenerating: false });
    }
  },
}));
