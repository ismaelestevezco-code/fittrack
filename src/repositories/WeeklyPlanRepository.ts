import { getDatabase } from '@/database/database';
import type { WeeklyPlanRow } from '@/types/database.types';

export class WeeklyPlanRepository {
  // Devuelve el planning de una semana ISO concreta
  async getByWeek(year: number, weekNumber: number): Promise<WeeklyPlanRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<WeeklyPlanRow>(
      'SELECT * FROM weekly_plans WHERE year = ? AND week_number = ?',
      [year, weekNumber],
    );
  }

  // Devuelve todos los plannings ordenados de más reciente a más antiguo
  async getAll(): Promise<WeeklyPlanRow[]> {
    const db = getDatabase();
    return db.getAllAsync<WeeklyPlanRow>(
      'SELECT * FROM weekly_plans ORDER BY year DESC, week_number DESC',
    );
  }

  // Inserta o reemplaza el planning de una semana (UNIQUE constraint en year+week_number)
  async upsert(plan: Omit<WeeklyPlanRow, 'id'>): Promise<WeeklyPlanRow> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO weekly_plans
        (week_number, year, generated_at, summary, recommendations, data_snapshot)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(week_number, year) DO UPDATE SET
         generated_at   = excluded.generated_at,
         summary        = excluded.summary,
         recommendations = excluded.recommendations,
         data_snapshot  = excluded.data_snapshot`,
      [
        plan.week_number,
        plan.year,
        plan.generated_at,
        plan.summary,
        plan.recommendations,
        plan.data_snapshot,
      ],
    );
    const saved = await db.getFirstAsync<WeeklyPlanRow>(
      'SELECT * FROM weekly_plans WHERE year = ? AND week_number = ?',
      [plan.year, plan.week_number],
    );
    if (!saved) throw new Error('Error al guardar el planning');
    return saved;
  }
}

export const weeklyPlanRepository = new WeeklyPlanRepository();
