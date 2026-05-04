import { getDatabase } from '@/database/database';
import type { WorkoutSessionRow } from '@/types/database.types';

export type CreateSessionInput = {
  routine_day_id: number;
  date: number;
  week_number: number;
  year: number;
};

export class WorkoutSessionRepository {
  // Devuelve todas las sesiones de una semana ISO concreta
  async getByWeek(year: number, weekNumber: number): Promise<WorkoutSessionRow[]> {
    const db = getDatabase();
    return db.getAllAsync<WorkoutSessionRow>(
      'SELECT * FROM workout_sessions WHERE year = ? AND week_number = ? ORDER BY date ASC',
      [year, weekNumber],
    );
  }

  // Devuelve una sesión por id
  async getById(id: number): Promise<WorkoutSessionRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<WorkoutSessionRow>('SELECT * FROM workout_sessions WHERE id = ?', [id]);
  }

  // Devuelve la sesión completada para un día concreto (por routine_day_id y date)
  async getByDayAndDate(routineDayId: number, date: number): Promise<WorkoutSessionRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<WorkoutSessionRow>(
      'SELECT * FROM workout_sessions WHERE routine_day_id = ? AND date = ? ORDER BY started_at DESC LIMIT 1',
      [routineDayId, date],
    );
  }

  // Crea una sesión nueva (started_at = ahora, finished_at = null)
  async create(input: CreateSessionInput): Promise<WorkoutSessionRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const result = await db.runAsync(
      `INSERT INTO workout_sessions
        (routine_day_id, date, week_number, year, started_at, finished_at, notes, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
      [input.routine_day_id, input.date, input.week_number, input.year, now, now],
    );
    const session = await db.getFirstAsync<WorkoutSessionRow>(
      'SELECT * FROM workout_sessions WHERE id = ?',
      [result.lastInsertRowId],
    );
    if (!session) throw new Error('Error al crear la sesión');
    return session;
  }

  // Marca la sesión como finalizada (sets finished_at = ahora)
  async finish(id: number): Promise<WorkoutSessionRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    await db.runAsync('UPDATE workout_sessions SET finished_at = ? WHERE id = ?', [now, id]);
    const session = await db.getFirstAsync<WorkoutSessionRow>(
      'SELECT * FROM workout_sessions WHERE id = ?',
      [id],
    );
    if (!session) throw new Error('Sesión no encontrada');
    return session;
  }

  // Devuelve las sesiones más recientes de un routine_day (para comparativa)
  async getRecentByDay(routineDayId: number, limit = 5): Promise<WorkoutSessionRow[]> {
    const db = getDatabase();
    return db.getAllAsync<WorkoutSessionRow>(
      'SELECT * FROM workout_sessions WHERE routine_day_id = ? AND finished_at IS NOT NULL ORDER BY date DESC LIMIT ?',
      [routineDayId, limit],
    );
  }

  // Devuelve sesiones por lista de IDs (para historial de ejercicio)
  async getByIds(ids: number[]): Promise<WorkoutSessionRow[]> {
    if (ids.length === 0) return [];
    const db = getDatabase();
    const placeholders = ids.map(() => '?').join(', ');
    return db.getAllAsync<WorkoutSessionRow>(
      `SELECT * FROM workout_sessions WHERE id IN (${placeholders}) ORDER BY date ASC`,
      ids,
    );
  }

  // Devuelve sesiones finalizadas de los últimos N días (para WeekComparisonScreen)
  async getRecentFinished(days: number): Promise<WorkoutSessionRow[]> {
    const db = getDatabase();
    const since = Math.floor(Date.now() / 1000) - days * 86400;
    return db.getAllAsync<WorkoutSessionRow>(
      'SELECT * FROM workout_sessions WHERE finished_at IS NOT NULL AND date >= ? ORDER BY date ASC',
      [since],
    );
  }

  // Reabre una sesión finalizada (borra finished_at para volver a editarla)
  async reopen(id: number): Promise<WorkoutSessionRow> {
    const db = getDatabase();
    await db.runAsync('UPDATE workout_sessions SET finished_at = NULL WHERE id = ?', [id]);
    const session = await db.getFirstAsync<WorkoutSessionRow>(
      'SELECT * FROM workout_sessions WHERE id = ?',
      [id],
    );
    if (!session) throw new Error('Sesión no encontrada');
    return session;
  }

  // Elimina una sesión y sus set_logs (cascade por FK)
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [id]);
  }

  // Devuelve todas las sesiones ordenadas por fecha
  async getAll(): Promise<WorkoutSessionRow[]> {
    const db = getDatabase();
    return db.getAllAsync<WorkoutSessionRow>('SELECT * FROM workout_sessions ORDER BY date ASC');
  }
}

export const workoutSessionRepository = new WorkoutSessionRepository();
