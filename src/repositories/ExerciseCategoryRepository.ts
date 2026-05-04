import { getDatabase } from '@/database/database';
import type { ExerciseCategoryRow } from '@/types/database.types';

class ExerciseCategoryRepository {
  // Returns categories for a day, ordered by sort_order
  async getByDay(routineDayId: number): Promise<ExerciseCategoryRow[]> {
    const db = getDatabase();
    return db.getAllAsync<ExerciseCategoryRow>(
      'SELECT * FROM exercise_categories WHERE routine_day_id = ? ORDER BY sort_order ASC, id ASC',
      [routineDayId],
    );
  }

  // Creates a new category for a day
  async create(routineDayId: number, name: string): Promise<ExerciseCategoryRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const maxOrder = await db.getFirstAsync<{ m: number }>(
      'SELECT COALESCE(MAX(sort_order), -1) as m FROM exercise_categories WHERE routine_day_id = ?',
      [routineDayId],
    );
    const sortOrder = (maxOrder?.m ?? -1) + 1;
    const result = await db.runAsync(
      'INSERT INTO exercise_categories (routine_day_id, name, sort_order, created_at) VALUES (?, ?, ?, ?)',
      [routineDayId, name, sortOrder, now],
    );
    return {
      id: result.lastInsertRowId,
      routine_day_id: routineDayId,
      name,
      sort_order: sortOrder,
      created_at: now,
    };
  }

  // Renames a category
  async rename(id: number, name: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE exercise_categories SET name = ? WHERE id = ?', [name, id]);
  }

  // Deletes a category (exercises in it become uncategorized via ON DELETE SET NULL)
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM exercise_categories WHERE id = ?', [id]);
  }
}

export const exerciseCategoryRepository = new ExerciseCategoryRepository();
