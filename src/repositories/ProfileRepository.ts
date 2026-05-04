import { getDatabase } from '@/database/database';
import type { ProfileRow } from '@/types/database.types';

export type CreateProfileInput = Omit<ProfileRow, 'id' | 'created_at' | 'updated_at' | 'avatar_uri'> & { avatar_uri?: string | null };
export type UpdateProfileInput = Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>;

export class ProfileRepository {
  // Retorna el único perfil existente, o null si aún no se ha creado
  async getFirst(): Promise<ProfileRow | null> {
    const db = getDatabase();
    return db.getFirstAsync<ProfileRow>('SELECT * FROM profile LIMIT 1');
  }

  // Inserta el perfil inicial del usuario (solo se llama una vez durante el onboarding)
  async create(input: CreateProfileInput): Promise<ProfileRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const result = await db.runAsync(
      `INSERT INTO profile
        (name, age, height_cm, sex, initial_weight_kg, goal, experience_level, available_days, equipment, units, weighing_mode, weighing_days, avatar_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.age,
        input.height_cm,
        input.sex,
        input.initial_weight_kg,
        input.goal,
        input.experience_level,
        input.available_days,
        input.equipment,
        input.units,
        input.weighing_mode ?? 'daily',
        input.weighing_days ?? '[]',
        input.avatar_uri ?? null,
        now,
        now,
      ],
    );
    const profile = await db.getFirstAsync<ProfileRow>('SELECT * FROM profile WHERE id = ?', [
      result.lastInsertRowId,
    ]);
    if (!profile) throw new Error('Error al crear el perfil');
    return profile;
  }

  // Actualiza campos específicos del perfil existente; siempre actualiza updated_at
  async update(id: number, input: UpdateProfileInput): Promise<ProfileRow> {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const fields = Object.keys(input) as Array<keyof UpdateProfileInput>;
    const setClauses = fields.map(f => `${f} = ?`).join(', ');
    // Cast is safe: we only iterate keys that exist in the partial input object
    const values = fields.map(f => input[f] as string | number);
    await db.runAsync(`UPDATE profile SET ${setClauses}, updated_at = ? WHERE id = ?`, [
      ...values,
      now,
      id,
    ]);
    const profile = await db.getFirstAsync<ProfileRow>('SELECT * FROM profile WHERE id = ?', [id]);
    if (!profile) throw new Error('Perfil no encontrado');
    return profile;
  }
}

export const profileRepository = new ProfileRepository();
