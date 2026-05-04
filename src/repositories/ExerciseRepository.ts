import { getDatabase } from '@/database/database';
import type { ExerciseRow } from '@/types/database.types';

export type CreateExerciseInput = {
  routine_day_id: number;
  name: string;
  target_sets?: number;
  target_reps?: number;
  target_weight_kg?: number;
  rest_seconds?: number;
  notes?: string | null;
  sort_order?: number;
  category_id?: number | null;
};

export type UpdateExerciseInput = Partial<Omit<ExerciseRow, 'id' | 'routine_day_id' | 'created_at' | 'updated_at'>>;

export class ExerciseRepository {
  // Devuelve ejercicios activos de un día (excluye eliminados)
  async getByDay(routineDayId: number): Promise<ExerciseRow[]> {
    const db = getDatabase();
    return db.getAllAsync<ExerciseRow>(
      'SELECT * FROM exercises WHERE routine_day_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC',
      [routineDayId],
    );
  }

  // Devuelve ejercicios por IDs (incluye eliminados, para mostrar historial de sesiones pasadas)
  async getByIds(ids: number[]): Promise<ExerciseRow[]> {
    if (ids.length === 0) return [];
    const db = getDatabase();
    const placeholders = ids.map(() => '?').join(', ');
    return db.getAllAsync<ExerciseRow>(
      `SELECT * FROM exercises WHERE id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
      ids,
    );
  }

  // Devuelve un ejercicio por id
  async getById(id: number): Promise<ExerciseRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<ExerciseRow>('SELECT * FROM exercises WHERE id = ?', [id]);
  }

  // Crea un nuevo ejercicio en un día de rutina
  async create(input: CreateExerciseInput): Promise<ExerciseRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    // Calcular sort_order como el máximo actual + 1
    const maxRow = await db.getFirstAsync<{ max_order: number | null }>(
      'SELECT MAX(sort_order) as max_order FROM exercises WHERE routine_day_id = ?',
      [input.routine_day_id],
    );
    const sortOrder = input.sort_order ?? ((maxRow?.max_order ?? -1) + 1);

    const result = await db.runAsync(
      `INSERT INTO exercises
        (routine_day_id, name, target_sets, target_reps, target_weight_kg, rest_seconds, notes, sort_order, category_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.routine_day_id,
        input.name,
        input.target_sets ?? 3,
        input.target_reps ?? 10,
        input.target_weight_kg ?? 0,
        input.rest_seconds ?? 90,
        input.notes ?? null,
        sortOrder,
        input.category_id ?? null,
        now,
        now,
      ],
    );
    const exercise = await db.getFirstAsync<ExerciseRow>('SELECT * FROM exercises WHERE id = ?', [
      result.lastInsertRowId,
    ]);
    if (!exercise) throw new Error('Error al crear el ejercicio');
    return exercise;
  }

  // Actualiza campos del ejercicio; siempre actualiza updated_at
  async update(id: number, input: UpdateExerciseInput): Promise<ExerciseRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const fields = Object.keys(input) as Array<keyof UpdateExerciseInput>;
    const setClauses = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => input[f] as string | number | null);
    await db.runAsync(`UPDATE exercises SET ${setClauses}, updated_at = ? WHERE id = ?`, [
      ...values,
      now,
      id,
    ]);
    const exercise = await db.getFirstAsync<ExerciseRow>('SELECT * FROM exercises WHERE id = ?', [id]);
    if (!exercise) throw new Error('Ejercicio no encontrado');
    return exercise;
  }

  // Soft-delete: marca el ejercicio como eliminado sin borrar su historial de set_logs
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE exercises SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [Math.floor(Date.now() / 1000), id],
    );
  }

  // Asigna o quita la categoría de un ejercicio
  async setCategory(exerciseId: number, categoryId: number | null): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE exercises SET category_id = ?, updated_at = ? WHERE id = ?', [
      categoryId,
      Math.floor(Date.now() / 1000),
      exerciseId,
    ]);
  }

  // Devuelve todos los ejercicios de todas las rutinas
  async getAll(): Promise<ExerciseRow[]> {
    const db = getDatabase();
    return db.getAllAsync<ExerciseRow>('SELECT * FROM exercises ORDER BY routine_day_id ASC, sort_order ASC');
  }

  // Actualiza el sort_order de una lista de ejercicios (drag-to-reorder)
  async reorder(orderedIds: number[]): Promise<void> {
    const db = getDatabase();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync('UPDATE exercises SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
    }
  }
}

export const exerciseRepository = new ExerciseRepository();
