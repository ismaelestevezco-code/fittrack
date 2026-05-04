import { getDatabase } from '@/database/database';
import type { WeightGoalRow } from '@/types/database.types';

export type UpsertWeightGoalInput = {
  target_weight_kg: number;
  target_date: number;
};

export class WeightGoalRepository {
  // Devuelve el objetivo activo (solo puede existir uno)
  async get(): Promise<WeightGoalRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<WeightGoalRow>('SELECT * FROM weight_goal LIMIT 1');
  }

  // Reemplaza el objetivo existente por uno nuevo
  async upsert(input: UpsertWeightGoalInput): Promise<WeightGoalRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    await db.runAsync('DELETE FROM weight_goal');
    const result = await db.runAsync(
      'INSERT INTO weight_goal (target_weight_kg, target_date, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [input.target_weight_kg, input.target_date, now, now],
    );
    const row = await db.getFirstAsync<WeightGoalRow>(
      'SELECT * FROM weight_goal WHERE id = ?',
      [result.lastInsertRowId],
    );
    if (!row) throw new Error('Error al guardar el objetivo');
    return row;
  }

  // Elimina el objetivo activo
  async delete(): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM weight_goal');
  }
}

export const weightGoalRepository = new WeightGoalRepository();
