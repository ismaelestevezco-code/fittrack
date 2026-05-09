import { getDatabase } from '@/database/database';
import type { SetLogRow } from '@/types/database.types';

export type CreateSetLogInput = {
  workout_session_id: number;
  exercise_id: number;
  set_number: number;
  reps_done: number;
  weight_kg: number;
  is_warmup?: 0 | 1;
  rpe?: number | null;
};

export type UpdateSetLogInput = Partial<Pick<SetLogRow, 'reps_done' | 'weight_kg' | 'is_warmup' | 'rpe'>>;

export class SetLogRepository {
  // Devuelve todos los sets de una sesión ordenados por ejercicio y número de serie
  async getBySession(sessionId: number): Promise<SetLogRow[]> {
    const db = getDatabase();
    return db.getAllAsync<SetLogRow>(
      'SELECT * FROM set_logs WHERE workout_session_id = ? ORDER BY exercise_id ASC, set_number ASC',
      [sessionId],
    );
  }

  // Devuelve todos los sets de un ejercicio a lo largo de la historia (para gráficas)
  async getByExercise(exerciseId: number): Promise<SetLogRow[]> {
    const db = getDatabase();
    return db.getAllAsync<SetLogRow>(
      'SELECT * FROM set_logs WHERE exercise_id = ? ORDER BY created_at ASC',
      [exerciseId],
    );
  }

  // Crea un nuevo set_log (se llama en tiempo real durante el entrenamiento)
  async create(input: CreateSetLogInput): Promise<SetLogRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const result = await db.runAsync(
      `INSERT INTO set_logs
        (workout_session_id, exercise_id, set_number, reps_done, weight_kg, is_warmup, rpe, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.workout_session_id,
        input.exercise_id,
        input.set_number,
        input.reps_done,
        input.weight_kg,
        input.is_warmup ?? 0,
        input.rpe ?? null,
        now,
      ],
    );
    const setLog = await db.getFirstAsync<SetLogRow>('SELECT * FROM set_logs WHERE id = ?', [
      result.lastInsertRowId,
    ]);
    if (!setLog) throw new Error('Error al guardar la serie');
    return setLog;
  }

  // Actualiza peso y/o reps de un set ya guardado
  async update(id: number, input: UpdateSetLogInput): Promise<SetLogRow> {
    const db = getDatabase();
    const fields = Object.keys(input) as Array<keyof UpdateSetLogInput>;
    const setClauses = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => input[f] as number | null);
    await db.runAsync(`UPDATE set_logs SET ${setClauses} WHERE id = ?`, [...values, id]);
    const setLog = await db.getFirstAsync<SetLogRow>('SELECT * FROM set_logs WHERE id = ?', [id]);
    if (!setLog) throw new Error('Serie no encontrada');
    return setLog;
  }

  // Elimina un set_log (cuando el usuario quita una serie durante el entrenamiento)
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM set_logs WHERE id = ?', [id]);
  }

  // Elimina todos los sets de una sesión (para rollback si se cancela)
  async deleteBySession(sessionId: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM set_logs WHERE workout_session_id = ?', [sessionId]);
  }

  // Devuelve sets de múltiples sesiones en una sola consulta (para WeekComparisonScreen)
  async getBySessionIds(sessionIds: number[]): Promise<SetLogRow[]> {
    if (sessionIds.length === 0) return [];
    const db = getDatabase();
    const placeholders = sessionIds.map(() => '?').join(', ');
    return db.getAllAsync<SetLogRow>(
      `SELECT * FROM set_logs WHERE workout_session_id IN (${placeholders}) ORDER BY exercise_id ASC, set_number ASC`,
      sessionIds,
    );
  }

  // Devuelve totales de series y volumen para un conjunto de sesiones (para resumen semanal)
  async getWeekAggregates(sessionIds: number[]): Promise<{ totalSets: number; totalVolumeKg: number }> {
    if (sessionIds.length === 0) return { totalSets: 0, totalVolumeKg: 0 };
    const db = getDatabase();
    const placeholders = sessionIds.map(() => '?').join(', ');
    const row = await db.getFirstAsync<{ total_sets: number; total_volume: number }>(
      `SELECT COUNT(*) as total_sets, SUM(reps_done * weight_kg) as total_volume
       FROM set_logs WHERE workout_session_id IN (${placeholders}) AND is_warmup = 0`,
      sessionIds,
    );
    return {
      totalSets: row?.total_sets ?? 0,
      totalVolumeKg: row?.total_volume ?? 0,
    };
  }

  // Devuelve todos los set_logs
  async getAll(): Promise<SetLogRow[]> {
    const db = getDatabase();
    return db.getAllAsync<SetLogRow>('SELECT * FROM set_logs ORDER BY workout_session_id ASC, set_number ASC');
  }

  // Peso máximo por ejercicio en la última sesión completada del día (para mostrar en DayDetailScreen)
  async getLastSessionWeightsForDay(routineDayId: number): Promise<Record<number, number>> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{ exercise_id: number; max_weight: number }>(
      `SELECT sl.exercise_id, MAX(sl.weight_kg) as max_weight
       FROM set_logs sl
       JOIN workout_sessions ws ON ws.id = sl.workout_session_id
       WHERE ws.routine_day_id = ? AND ws.finished_at IS NOT NULL
         AND ws.id = (
           SELECT id FROM workout_sessions
           WHERE routine_day_id = ? AND finished_at IS NOT NULL
           ORDER BY finished_at DESC LIMIT 1
         )
       GROUP BY sl.exercise_id`,
      [routineDayId, routineDayId],
    );
    return Object.fromEntries(rows.map(r => [r.exercise_id, r.max_weight]));
  }

  // Peso máximo histórico por ejercicio (para detectar PRs)
  async getAllTimeMaxWeightPerExercise(exerciseIds: number[]): Promise<Record<number, number>> {
    if (exerciseIds.length === 0) return {};
    const db = getDatabase();
    const placeholders = exerciseIds.map(() => '?').join(', ');
    const rows = await db.getAllAsync<{ exercise_id: number; max_weight: number }>(
      `SELECT exercise_id, MAX(weight_kg) as max_weight FROM set_logs
       WHERE exercise_id IN (${placeholders})
       GROUP BY exercise_id`,
      exerciseIds,
    );
    return Object.fromEntries(rows.map(r => [r.exercise_id, r.max_weight]));
  }

  // Ejercicios que batieron su récord de peso en la sesión dada (count + nombres)
  async countPRsInSession(sessionId: number): Promise<{ count: number; exerciseNames: string[] }> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{ exercise_name: string }>(
      `SELECT DISTINCT e.name as exercise_name
       FROM set_logs sl
       JOIN exercises e ON e.id = sl.exercise_id
       WHERE sl.workout_session_id = ?
         AND sl.weight_kg > (
           SELECT COALESCE(MAX(sl2.weight_kg), 0)
           FROM set_logs sl2
           JOIN workout_sessions ws2 ON ws2.id = sl2.workout_session_id
           WHERE sl2.exercise_id = sl.exercise_id
             AND ws2.id != sl.workout_session_id
         )`,
      [sessionId],
    );
    return { count: rows.length, exerciseNames: rows.map(r => r.exercise_name) };
  }
}

export const setLogRepository = new SetLogRepository();
