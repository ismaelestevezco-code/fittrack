import { getDatabase } from '@/database/database';
import type { BodyMeasurementRow } from '@/types/database.types';

export type UpsertMeasurementInput = {
  date: number;
  chest_cm?: number | null;
  waist_cm?: number | null;
  hips_cm?: number | null;
  left_arm_cm?: number | null;
  right_arm_cm?: number | null;
  left_leg_cm?: number | null;
  right_leg_cm?: number | null;
  notes?: string | null;
};

export class BodyMeasurementRepository {
  // Devuelve todos los registros ordenados por fecha descendente
  async getAll(): Promise<BodyMeasurementRow[]> {
    const db = getDatabase();
    return db.getAllAsync<BodyMeasurementRow>(
      'SELECT * FROM body_measurements ORDER BY date DESC',
    );
  }

  // Devuelve el registro más reciente
  async getLatest(): Promise<BodyMeasurementRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<BodyMeasurementRow>(
      'SELECT * FROM body_measurements ORDER BY date DESC LIMIT 1',
    );
  }

  // Devuelve el registro de una fecha concreta (timestamp primer día del mes)
  async getByDate(date: number): Promise<BodyMeasurementRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<BodyMeasurementRow>(
      'SELECT * FROM body_measurements WHERE date = ?',
      [date],
    );
  }

  // INSERT con ON CONFLICT UPDATE (date es UNIQUE)
  async upsert(input: UpsertMeasurementInput): Promise<BodyMeasurementRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    await db.runAsync(
      `INSERT INTO body_measurements
         (date, chest_cm, waist_cm, hips_cm, left_arm_cm, right_arm_cm, left_leg_cm, right_leg_cm, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         chest_cm = excluded.chest_cm, waist_cm = excluded.waist_cm, hips_cm = excluded.hips_cm,
         left_arm_cm = excluded.left_arm_cm, right_arm_cm = excluded.right_arm_cm,
         left_leg_cm = excluded.left_leg_cm, right_leg_cm = excluded.right_leg_cm,
         notes = excluded.notes, updated_at = excluded.updated_at`,
      [
        input.date,
        input.chest_cm ?? null,
        input.waist_cm ?? null,
        input.hips_cm ?? null,
        input.left_arm_cm ?? null,
        input.right_arm_cm ?? null,
        input.left_leg_cm ?? null,
        input.right_leg_cm ?? null,
        input.notes ?? null,
        now,
        now,
      ],
    );
    const row = await db.getFirstAsync<BodyMeasurementRow>(
      'SELECT * FROM body_measurements WHERE date = ?',
      [input.date],
    );
    if (!row) throw new Error('Error al guardar las medidas');
    return row;
  }

  // Elimina un registro por id
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM body_measurements WHERE id = ?', [id]);
  }
}

export const bodyMeasurementRepository = new BodyMeasurementRepository();
