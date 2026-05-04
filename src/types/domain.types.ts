import type { ExerciseRow, SetLogRow } from './database.types';

export interface RecommendationItem {
  id: string;
  category: 'training' | 'weight' | 'recovery' | 'nutrition_hint' | 'general';
  priority: 'high' | 'medium' | 'low';
  icon: string;
  title: string;
  description: string;
  actionable: boolean;
}

export interface ExerciseWithSets {
  exercise: ExerciseRow;
  plannedSets: Array<{ setNumber: number; targetReps: number; targetWeight: number }>;
  loggedSets: SetLogRow[];
}

export interface WeeklyProgress {
  weekNumber: number;
  year: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  totalVolumeKg: number;
  averageWeightKg: number | null;
  adherencePercent: number;
}

export interface ExerciseProgressPoint {
  date: number;
  maxWeightKg: number;
  totalVolumeKg: number;
  totalReps: number;
}
