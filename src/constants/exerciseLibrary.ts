// Biblioteca de ejercicios predefinidos agrupados por grupo muscular.
// El usuario puede buscar y seleccionar ejercicios de esta lista
// en lugar de tener que escribirlos manualmente.

export interface LibraryExercise {
  name: string;
  muscleGroup: string;
  equipment: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable' | 'any';
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
  notes?: string;
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // ─── PECHO ──────────────────────────────────────────────────────────
  { name: 'Press banca', muscleGroup: 'Pecho', equipment: 'barbell', defaultSets: 4, defaultReps: 8, defaultRestSeconds: 120 },
  { name: 'Press inclinado barra', muscleGroup: 'Pecho', equipment: 'barbell', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: 'Press declinado barra', muscleGroup: 'Pecho', equipment: 'barbell', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: 'Press inclinado mancuernas', muscleGroup: 'Pecho', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 90 },
  { name: 'Aperturas con mancuernas', muscleGroup: 'Pecho', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: 'Flexiones', muscleGroup: 'Pecho', equipment: 'bodyweight', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: 'Aperturas en polea cruzada', muscleGroup: 'Pecho', equipment: 'cable', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: 'Press en máquina', muscleGroup: 'Pecho', equipment: 'machine', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 90 },

  // ─── ESPALDA ─────────────────────────────────────────────────────────
  { name: 'Peso muerto', muscleGroup: 'Espalda', equipment: 'barbell', defaultSets: 4, defaultReps: 5, defaultRestSeconds: 180 },
  { name: 'Remo con barra', muscleGroup: 'Espalda', equipment: 'barbell', defaultSets: 4, defaultReps: 8, defaultRestSeconds: 120 },
  { name: 'Dominadas', muscleGroup: 'Espalda', equipment: 'bodyweight', defaultSets: 4, defaultReps: 8, defaultRestSeconds: 120 },
  { name: 'Jalón al pecho', muscleGroup: 'Espalda', equipment: 'cable', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: 'Remo en polea baja', muscleGroup: 'Espalda', equipment: 'cable', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: 'Remo mancuerna a una mano', muscleGroup: 'Espalda', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 90 },
  { name: 'Pull-over mancuerna', muscleGroup: 'Espalda', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: 'Remo en máquina', muscleGroup: 'Espalda', equipment: 'machine', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 90 },

  // ─── HOMBROS ─────────────────────────────────────────────────────────
  { name: 'Press militar', muscleGroup: 'Hombros', equipment: 'barbell', defaultSets: 4, defaultReps: 8, defaultRestSeconds: 120 },
  { name: 'Press Arnold', muscleGroup: 'Hombros', equipment: 'dumbbell', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: 'Elevaciones laterales', muscleGroup: 'Hombros', equipment: 'dumbbell', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: 'Elevaciones frontales', muscleGroup: 'Hombros', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: 'Pájaro (posterior)', muscleGroup: 'Hombros', equipment: 'dumbbell', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: 'Encogimientos de hombros', muscleGroup: 'Hombros', equipment: 'barbell', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },

  // ─── PIERNAS ─────────────────────────────────────────────────────────
  { name: 'Sentadilla', muscleGroup: 'Piernas', equipment: 'barbell', defaultSets: 4, defaultReps: 8, defaultRestSeconds: 180 },
  { name: 'Peso muerto rumano', muscleGroup: 'Piernas', equipment: 'barbell', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 120 },
  { name: 'Prensa de pierna', muscleGroup: 'Piernas', equipment: 'machine', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 120 },
  { name: 'Extensión de cuádriceps', muscleGroup: 'Piernas', equipment: 'machine', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: 'Curl de isquiotibiales', muscleGroup: 'Piernas', equipment: 'machine', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: 'Zancadas con mancuernas', muscleGroup: 'Piernas', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 90 },
  { name: 'Sentadilla búlgara', muscleGroup: 'Piernas', equipment: 'dumbbell', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 120 },
  { name: 'Hip thrust', muscleGroup: 'Piernas', equipment: 'barbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 90 },
  { name: 'Elevación de gemelos de pie', muscleGroup: 'Piernas', equipment: 'machine', defaultSets: 4, defaultReps: 15, defaultRestSeconds: 60 },
  { name: 'Sentadilla hack', muscleGroup: 'Piernas', equipment: 'machine', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 120 },

  // ─── BÍCEPS ──────────────────────────────────────────────────────────
  { name: 'Curl bíceps barra', muscleGroup: 'Bíceps', equipment: 'barbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: 'Curl martillo', muscleGroup: 'Bíceps', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: 'Curl predicador', muscleGroup: 'Bíceps', equipment: 'barbell', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 60 },
  { name: 'Curl concentrado', muscleGroup: 'Bíceps', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: 'Curl en polea baja', muscleGroup: 'Bíceps', equipment: 'cable', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },

  // ─── TRÍCEPS ─────────────────────────────────────────────────────────
  { name: 'Press francés', muscleGroup: 'Tríceps', equipment: 'barbell', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: 'Extensión tríceps polea', muscleGroup: 'Tríceps', equipment: 'cable', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },
  { name: 'Fondos en paralelas', muscleGroup: 'Tríceps', equipment: 'bodyweight', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 90 },
  { name: 'Fondos en banco', muscleGroup: 'Tríceps', equipment: 'bodyweight', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 60 },
  { name: 'Patada de tríceps', muscleGroup: 'Tríceps', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultRestSeconds: 60 },

  // ─── CORE ────────────────────────────────────────────────────────────
  { name: 'Plancha', muscleGroup: 'Core', equipment: 'bodyweight', defaultSets: 3, defaultReps: 1, defaultRestSeconds: 45, notes: 'Aguantar 30-60 segundos' },
  { name: 'Crunch abdominal', muscleGroup: 'Core', equipment: 'bodyweight', defaultSets: 3, defaultReps: 20, defaultRestSeconds: 45 },
  { name: 'Elevación de piernas', muscleGroup: 'Core', equipment: 'bodyweight', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 45 },
  { name: 'Rueda abdominal', muscleGroup: 'Core', equipment: 'any', defaultSets: 3, defaultReps: 10, defaultRestSeconds: 60 },
  { name: 'Crunch en polea', muscleGroup: 'Core', equipment: 'cable', defaultSets: 3, defaultReps: 15, defaultRestSeconds: 45 },
  { name: 'Plancha lateral', muscleGroup: 'Core', equipment: 'bodyweight', defaultSets: 3, defaultReps: 1, defaultRestSeconds: 45, notes: '20-30 seg cada lado' },
];

export const MUSCLE_GROUPS = [...new Set(EXERCISE_LIBRARY.map(e => e.muscleGroup))].sort();

// Buscar ejercicios por nombre o grupo muscular
export function searchExercises(query: string, muscleGroup?: string): LibraryExercise[] {
  const q = query.toLowerCase().trim();
  return EXERCISE_LIBRARY.filter(ex => {
    const matchesQuery = q === '' || ex.name.toLowerCase().includes(q);
    const matchesGroup = !muscleGroup || ex.muscleGroup === muscleGroup;
    return matchesQuery && matchesGroup;
  });
}
