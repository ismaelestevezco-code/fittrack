import { getDatabase } from '@/database/database';
import type { RoutineRow, RoutineDayRow } from '@/types/database.types';

export type CreateRoutineInput = { name: string };
export type UpdateDayInput = { name?: string; is_rest_day?: 0 | 1 };

export class RoutineRepository {
  // Devuelve la rutina activa actual, o null si no existe ninguna
  async getActive(): Promise<RoutineRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<RoutineRow>('SELECT * FROM routines WHERE is_active = 1 LIMIT 1');
  }

  // Devuelve todas las rutinas existentes
  async getAll(): Promise<RoutineRow[]> {
    const db = getDatabase();
    return db.getAllAsync<RoutineRow>('SELECT * FROM routines ORDER BY created_at DESC');
  }

  // Crea una rutina nueva con 7 días vacíos (Lun–Dom)
  async create(input: CreateRoutineInput): Promise<RoutineRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    const result = await db.runAsync(
      'INSERT INTO routines (name, is_active, created_at, updated_at) VALUES (?, 1, ?, ?)',
      [input.name, now, now],
    );
    const routineId = result.lastInsertRowId;

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    for (let i = 0; i < 7; i++) {
      await db.runAsync(
        'INSERT INTO routine_days (routine_id, day_of_week, name, is_rest_day, sort_order, created_at) VALUES (?, ?, ?, 0, ?, ?)',
        [routineId, i + 1, dayNames[i], i, now],
      );
    }

    // Desactivar otras rutinas que pudieran estar activas
    await db.runAsync('UPDATE routines SET is_active = 0 WHERE id != ?', [routineId]);

    const routine = await db.getFirstAsync<RoutineRow>('SELECT * FROM routines WHERE id = ?', [routineId]);
    if (!routine) throw new Error('Error al crear la rutina');
    return routine;
  }

  // Activa una rutina y desactiva el resto
  async setActive(id: number): Promise<void> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    await db.runAsync('UPDATE routines SET is_active = 0, updated_at = ?', [now]);
    await db.runAsync('UPDATE routines SET is_active = 1, updated_at = ? WHERE id = ?', [now, id]);
  }

  // Elimina una rutina, sus sesiones de entrenamiento y sus días/ejercicios en cascada
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    // Borrar sesiones asociadas antes de los routine_days (evita FK violation)
    await db.execAsync(
      `DELETE FROM workout_sessions WHERE routine_day_id IN (SELECT id FROM routine_days WHERE routine_id = ${id})`,
    );
    await db.runAsync('DELETE FROM routines WHERE id = ?', [id]);
  }

  // Devuelve todos los días de una rutina ordenados por día de semana
  async getDaysForRoutine(routineId: number): Promise<RoutineDayRow[]> {
    const db = getDatabase();
    return db.getAllAsync<RoutineDayRow>(
      'SELECT * FROM routine_days WHERE routine_id = ? ORDER BY day_of_week ASC',
      [routineId],
    );
  }

  // Devuelve todos los días de todas las rutinas
  async getAllDays(): Promise<RoutineDayRow[]> {
    const db = getDatabase();
    return db.getAllAsync<RoutineDayRow>('SELECT * FROM routine_days ORDER BY routine_id ASC, day_of_week ASC');
  }

  // Devuelve un día concreto por id
  async getDayById(id: number): Promise<RoutineDayRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<RoutineDayRow>('SELECT * FROM routine_days WHERE id = ?', [id]);
  }

  // Actualiza nombre y/o estado de descanso de un día
  async updateDay(id: number, input: UpdateDayInput): Promise<RoutineDayRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const fields = Object.keys(input) as Array<keyof UpdateDayInput>;
    const setClauses = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => input[f] as string | number);
    await db.runAsync(`UPDATE routine_days SET ${setClauses} WHERE id = ?`, [...values, id]);
    const day = await db.getFirstAsync<RoutineDayRow>('SELECT * FROM routine_days WHERE id = ?', [id]);
    if (!day) throw new Error('Día no encontrado');
    return day;
  }

  // Actualiza el nombre de la rutina
  async rename(id: number, name: string): Promise<RoutineRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    await db.runAsync('UPDATE routines SET name = ?, updated_at = ? WHERE id = ?', [name, now, id]);
    const routine = await db.getFirstAsync<RoutineRow>('SELECT * FROM routines WHERE id = ?', [id]);
    if (!routine) throw new Error('Rutina no encontrada');
    return routine;
  }

  // Crea una rutina completa desde una plantilla, incluyendo todos sus días y ejercicios.
  // Desactiva cualquier rutina activa previa antes de crear la nueva.
  async createFromTemplate(
    templateName: string,
    days: Array<{
      dayOfWeek: number;
      name: string;
      isRestDay: boolean;
      exercises: Array<{
        name: string;
        targetSets: number;
        targetReps: number;
        targetWeightKg: number;
        restSeconds: number;
        notes?: string;
      }>;
    }>,
  ): Promise<number> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    await db.runAsync(
      'UPDATE routines SET is_active = 0, updated_at = ? WHERE is_active = 1',
      [now],
    );

    const result = await db.runAsync(
      'INSERT INTO routines (name, is_active, created_at, updated_at) VALUES (?, 1, ?, ?)',
      [templateName, now, now],
    );
    const routineId = result.lastInsertRowId;

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const dayResult = await db.runAsync(
        `INSERT INTO routine_days (routine_id, day_of_week, name, is_rest_day, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [routineId, day.dayOfWeek, day.name, day.isRestDay ? 1 : 0, i, now],
      );
      const dayId = dayResult.lastInsertRowId;

      if (!day.isRestDay) {
        for (let j = 0; j < day.exercises.length; j++) {
          const ex = day.exercises[j];
          await db.runAsync(
            `INSERT INTO exercises
             (routine_day_id, name, target_sets, target_reps, target_weight_kg, rest_seconds, notes, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [dayId, ex.name, ex.targetSets, ex.targetReps, ex.targetWeightKg,
              ex.restSeconds, ex.notes ?? null, j, now, now],
          );
        }
      }
    }

    return routineId;
  }
}

export const routineRepository = new RoutineRepository();
