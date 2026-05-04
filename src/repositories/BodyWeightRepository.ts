import { getDatabase } from '@/database/database';
import type { BodyWeightRow } from '@/types/database.types';

export type UpsertWeightInput = {
  weight_kg: number;
  date: number;
  notes?: string | null;
};

export class BodyWeightRepository {
  // Devuelve todos los registros ordenados por fecha descendente
  async getAll(): Promise<BodyWeightRow[]> {
    const db = getDatabase();
    return db.getAllAsync<BodyWeightRow>('SELECT * FROM body_weights ORDER BY date DESC');
  }

  // Devuelve registros de los últimos N días ordenados por fecha ascendente
  async getRecent(days: number): Promise<BodyWeightRow[]> {
    const db = getDatabase();
    const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
    return db.getAllAsync<BodyWeightRow>(
      'SELECT * FROM body_weights WHERE date >= ? ORDER BY date ASC',
      [cutoff],
    );
  }

  // Devuelve el registro más reciente
  async getLatest(): Promise<BodyWeightRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<BodyWeightRow>(
      'SELECT * FROM body_weights ORDER BY date DESC LIMIT 1',
    );
  }

  // Devuelve el registro de una fecha concreta (timestamp medianoche UTC)
  async getByDate(date: number): Promise<BodyWeightRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<BodyWeightRow>(
      'SELECT * FROM body_weights WHERE date = ?',
      [date],
    );
  }

  // INSERT con ON CONFLICT UPDATE (date es UNIQUE)
  async upsert(input: UpsertWeightInput): Promise<BodyWeightRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    await db.runAsync(
      `INSERT INTO body_weights (weight_kg, date, notes, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg, notes = excluded.notes`,
      [input.weight_kg, input.date, input.notes ?? null, now],
    );
    const row = await db.getFirstAsync<BodyWeightRow>(
      'SELECT * FROM body_weights WHERE date = ?',
      [input.date],
    );
    if (!row) throw new Error('Error al guardar el peso');
    return row;
  }

  // Elimina un registro por id
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM body_weights WHERE id = ?', [id]);
  }
}

export const bodyWeightRepository = new BodyWeightRepository();
