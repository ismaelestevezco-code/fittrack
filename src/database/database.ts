import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '@/constants/config';
import { CREATE_TABLES_SQL } from './schema';
import { runMigrations } from './migrations';

// Singleton de conexión — una sola instancia para toda la app
let _db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return _db;
}

export async function initDatabase(): Promise<void> {
  if (_db) {
    return;
  }

  _db = await SQLite.openDatabaseAsync(DB_NAME);

  // Habilitar foreign keys y WAL para mejor rendimiento
  await _db.execAsync('PRAGMA foreign_keys = ON;');
  await _db.execAsync('PRAGMA journal_mode = WAL;');

  // Crear todas las tablas si no existen
  await _db.execAsync(CREATE_TABLES_SQL);

  // Aplicar migraciones pendientes
  await runMigrations(_db);

  if (__DEV__) {
    console.warn('[DB] Base de datos inicializada correctamente:', DB_NAME);
  }
}

export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}

// Elimina todos los datos del usuario manteniendo el esquema intacto
export async function clearAllData(): Promise<void> {
  const db = getDatabase();
  // Orden: primero tablas dependientes, luego las referenciadas
  await db.execAsync(`
    DELETE FROM set_logs;
    DELETE FROM workout_sessions;
    DELETE FROM exercises;
    DELETE FROM routine_days;
    DELETE FROM routines;
    DELETE FROM weekly_plans;
    DELETE FROM body_weights;
    DELETE FROM body_measurements;
    DELETE FROM weight_goal;
    DELETE FROM profile;
  `);
}
