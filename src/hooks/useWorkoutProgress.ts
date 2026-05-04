import { useState, useEffect } from 'react';
import { setLogRepository } from '@/repositories/SetLogRepository';
import { workoutSessionRepository } from '@/repositories/WorkoutSessionRepository';
import { calculateExerciseProgress } from '@/logic/progressCalculator';
import type { ExerciseProgressPoint } from '@/types/domain.types';
import type { SetLogRow, WorkoutSessionRow } from '@/types/database.types';

export interface SessionDetail {
  session: WorkoutSessionRow;
  sets: SetLogRow[];
}

export interface WorkoutProgressState {
  // Puntos de evolución del ejercicio ordenados cronológicamente
  progressPoints: ExerciseProgressPoint[];
  // Últimas 10 sesiones con sus sets, de más reciente a más antigua
  recentSessions: SessionDetail[];
  isLoading: boolean;
}

// Hook que carga y calcula el progreso histórico de un ejercicio específico
export function useWorkoutProgress(exerciseId: number): WorkoutProgressState {
  const [state, setState] = useState<WorkoutProgressState>({
    progressPoints: [],
    recentSessions: [],
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState(prev => ({ ...prev, isLoading: true }));

    async function load() {
      const setLogs = await setLogRepository.getByExercise(exerciseId);
      const sessionIds = [...new Set(setLogs.map(l => l.workout_session_id))];
      const sessions = await workoutSessionRepository.getByIds(sessionIds);

      if (cancelled) return;

      const progressPoints = calculateExerciseProgress(setLogs, sessions);

      const recentSessions: SessionDetail[] = sessions
        .filter(s => s.finished_at != null)
        .sort((a, b) => b.date - a.date)
        .slice(0, 10)
        .map(session => ({
          session,
          sets: setLogs
            .filter(l => l.workout_session_id === session.id && l.is_warmup === 0)
            .sort((a, b) => a.set_number - b.set_number),
        }));

      setState({ progressPoints, recentSessions, isLoading: false });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  return state;
}
