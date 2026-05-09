import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from './firebaseConfig';
import { getDatabase } from '@/database/database';

// ─────────────────────────────────────────────────────────────────────────────
// SyncService: exporta todos los datos de SQLite a Firestore (backup en la nube)
// y los restaura desde Firestore a SQLite (restauración tras reinstalar la app).
//
// Estrategia: snapshot completo. El documento de Firestore contiene todos los
// datos del usuario como un JSON único. Sencillo y suficiente para uso personal.
// ─────────────────────────────────────────────────────────────────────────────

interface UserSnapshot {
  lastSyncAt: number;
  data: Record<string, unknown[]>;
}

const TABLES = [
  'profile',
  'weight_goal',
  'routines',
  'routine_days',
  'exercises',
  'workout_sessions',
  'set_logs',
  'body_weights',
  'body_measurements',
  'weekly_plans',
];

async function exportFromSQLite(): Promise<Record<string, unknown[]>> {
  const db = getDatabase();
  const snapshot: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    const rows = await db.getAllAsync(`SELECT * FROM ${table}`);
    snapshot[table] = rows;
  }

  return snapshot;
}

async function importToSQLite(data: Record<string, unknown[]>): Promise<void> {
  const db = getDatabase();

  await db.withTransactionAsync(async () => {
    // Borrar datos existentes (orden inverso para respetar FK)
    const reverseTables = [...TABLES].reverse();
    for (const table of reverseTables) {
      await db.runAsync(`DELETE FROM ${table}`);
    }

    // Insertar datos del snapshot
    for (const table of TABLES) {
      const rows = data[table] ?? [];
      if (rows.length === 0) continue;

      const firstRow = rows[0] as Record<string, unknown>;
      const columns = Object.keys(firstRow);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = columns.map(col => (row as Record<string, unknown>)[col]);
        await db.runAsync(sql, values as (string | number | null)[]);
      }
    }
  });
}

export async function uploadSnapshot(userId: string): Promise<void> {
  try {
    const firestoreDb = getFirebaseDb();
    const data = await exportFromSQLite();
    const snapshot: UserSnapshot = {
      lastSyncAt: Math.floor(Date.now() / 1000),
      data,
    };
    await setDoc(doc(firestoreDb, 'users', userId), snapshot);
  } catch (err) {
    if (__DEV__) console.log('SyncService uploadSnapshot error:', err);
  }
}

export async function downloadSnapshot(userId: string): Promise<boolean> {
  try {
    const firestoreDb = getFirebaseDb();
    const snap = await getDoc(doc(firestoreDb, 'users', userId));
    if (!snap.exists()) return false;

    const { data } = snap.data() as UserSnapshot;
    if (!data) return false;

    await importToSQLite(data);
    return true;
  } catch (err) {
    if (__DEV__) console.log('SyncService downloadSnapshot error:', err);
    return false;
  }
}

// Sincronización inteligente al iniciar sesión:
// - Si el dispositivo tiene datos locales (tiene perfil) → sube a Firestore
// - Si el dispositivo está vacío → descarga de Firestore
export async function smartSync(userId: string): Promise<'uploaded' | 'downloaded' | 'nothing'> {
  try {
    const db = getDatabase();
    const rows = await db.getAllAsync('SELECT id FROM profile LIMIT 1');
    const hasLocalData = rows.length > 0;

    if (hasLocalData) {
      await uploadSnapshot(userId);
      return 'uploaded';
    } else {
      const restored = await downloadSnapshot(userId);
      return restored ? 'downloaded' : 'nothing';
    }
  } catch (err) {
    if (__DEV__) console.log('SyncService smartSync error:', err);
    return 'nothing';
  }
}
