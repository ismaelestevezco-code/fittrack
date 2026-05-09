import type { SQLiteDatabase } from 'expo-sqlite';
import { DB_VERSION } from '@/constants/config';

interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

// Cada migración aplica cambios incrementales al esquema según la versión de DB
const MIGRATIONS: Migration[] = [
  // v1 → esquema inicial; las tablas se crean en schema.ts via initDatabase
  {
    version: 1,
    description: 'Esquema inicial con todas las tablas base',
    up: async (_db: SQLiteDatabase) => {
      // No-op: el esquema inicial se crea en database.ts con CREATE TABLE IF NOT EXISTS
    },
  },
  // v2 → añade 'body_recomp' al CHECK constraint de profile.goal
  // SQLite no permite ALTER TABLE para cambiar constraints; se recrea la tabla
  {
    version: 2,
    description: "Añade 'body_recomp' como opción válida en profile.goal",
    up: async (db: SQLiteDatabase) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS profile_v2 (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          name              TEXT NOT NULL,
          age               INTEGER NOT NULL,
          height_cm         REAL NOT NULL,
          sex               TEXT NOT NULL CHECK(sex IN ('male', 'female', 'other')),
          initial_weight_kg REAL NOT NULL,
          goal              TEXT NOT NULL CHECK(goal IN ('lose_weight', 'gain_muscle', 'maintenance', 'sport_performance', 'body_recomp')),
          experience_level  TEXT NOT NULL CHECK(experience_level IN ('beginner', 'intermediate', 'advanced')),
          available_days    INTEGER NOT NULL DEFAULT 3,
          equipment         TEXT NOT NULL CHECK(equipment IN ('full_gym', 'home_gym', 'no_equipment')),
          units             TEXT NOT NULL DEFAULT 'metric' CHECK(units IN ('metric', 'imperial')),
          created_at        INTEGER NOT NULL,
          updated_at        INTEGER NOT NULL
        );
        INSERT INTO profile_v2 (id, name, age, height_cm, sex, initial_weight_kg, goal, experience_level, available_days, equipment, units, created_at, updated_at)
          SELECT id, name, age, height_cm, sex, initial_weight_kg, goal, experience_level, available_days, equipment, units, created_at, updated_at FROM profile;
        DROP TABLE profile;
        ALTER TABLE profile_v2 RENAME TO profile;
      `);
    },
  },
  // v3 → añade weighing_mode y weighing_days al perfil para controlar frecuencia de pesaje
  {
    version: 3,
    description: "Añade weighing_mode y weighing_days al perfil",
    up: async (db: SQLiteDatabase) => {
      await db.execAsync(`
        ALTER TABLE profile ADD COLUMN weighing_mode TEXT NOT NULL DEFAULT 'daily';
        ALTER TABLE profile ADD COLUMN weighing_days TEXT NOT NULL DEFAULT '[]';
      `);
    },
  },
  // v4 → añade exercise_categories y category_id en exercises para agrupar ejercicios por nombre
  {
    version: 4,
    description: 'Añade exercise_categories y category_id a exercises',
    up: async (db: SQLiteDatabase) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercise_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          routine_day_id INTEGER NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_exercategories_day ON exercise_categories(routine_day_id);
      `);
      // Wrapped in try-catch: fresh installs already have this column from schema.ts
      try {
        await db.execAsync(
          `ALTER TABLE exercises ADD COLUMN category_id INTEGER REFERENCES exercise_categories(id) ON DELETE SET NULL;`,
        );
      } catch { /* column already exists */ }
    },
  },
  {
    version: 5,
    description: 'Añade is_deleted a exercises para soft-delete (preserva historial)',
    up: async (db: SQLiteDatabase) => {
      // Wrapped in try-catch: fresh installs already have this column from schema.ts
      try {
        await db.execAsync(
          `ALTER TABLE exercises ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;`,
        );
      } catch { /* column already exists */ }
    },
  },
  {
    version: 6,
    description: 'Añade avatar_uri al perfil para foto de perfil personalizada',
    up: async (db: SQLiteDatabase) => {
      // Wrapped in try-catch: fresh installs already have this column from schema.ts
      try {
        await db.execAsync(`ALTER TABLE profile ADD COLUMN avatar_uri TEXT;`);
      } catch { /* column already exists */ }
    },
  },
  {
    version: 7,
    description: 'Añade measurement_frequency al perfil para frecuencia de registro de medidas',
    up: async (db: SQLiteDatabase) => {
      try {
        await db.execAsync(
          `ALTER TABLE profile ADD COLUMN measurement_frequency TEXT NOT NULL DEFAULT 'monthly';`,
        );
      } catch { /* column already exists in fresh installs */ }
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Obtener la versión actual de la DB
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DB_VERSION) {
    return;
  }

  // Ejecutar migraciones pendientes en orden
  const pending = MIGRATIONS.filter(m => m.version > currentVersion);
  for (const migration of pending) {
    if (__DEV__) {
      console.warn(`[DB] Aplicando migración v${migration.version}: ${migration.description}`);
    }
    await migration.up(db);
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
  }
}
