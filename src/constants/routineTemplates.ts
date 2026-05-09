// Plantillas de rutinas predefinidas que se ofrecen al usuario
// al completar el onboarding. Cada plantilla incluye los días con
// sus ejercicios preconfigurados listos para usar.

export interface ExerciseTemplate {
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeightKg: number;
  restSeconds: number;
  notes?: string;
}

export interface DayTemplate {
  dayOfWeek: number;
  name: string;
  isRestDay: boolean;
  exercises: ExerciseTemplate[];
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  equipment: 'full_gym' | 'home_gym' | 'no_equipment';
  days: DayTemplate[];
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  // ─── FULL BODY 3 DÍAS ───────────────────────────────────────────────
  {
    id: 'full_body_3',
    name: 'Full Body 3 días',
    description: 'Entrena todo el cuerpo en 3 sesiones semanales. Ideal para principiantes.',
    daysPerWeek: 3,
    level: 'beginner',
    equipment: 'full_gym',
    days: [
      {
        dayOfWeek: 1, name: 'Full Body A', isRestDay: false,
        exercises: [
          { name: 'Sentadilla', targetSets: 3, targetReps: 10, targetWeightKg: 40, restSeconds: 120 },
          { name: 'Press banca', targetSets: 3, targetReps: 10, targetWeightKg: 40, restSeconds: 90 },
          { name: 'Remo con barra', targetSets: 3, targetReps: 10, targetWeightKg: 35, restSeconds: 90 },
          { name: 'Press militar', targetSets: 3, targetReps: 10, targetWeightKg: 25, restSeconds: 90 },
          { name: 'Curl de bíceps', targetSets: 3, targetReps: 12, targetWeightKg: 15, restSeconds: 60 },
          { name: 'Extensión tríceps polea', targetSets: 3, targetReps: 12, targetWeightKg: 15, restSeconds: 60 },
        ],
      },
      { dayOfWeek: 2, name: 'Descanso', isRestDay: true, exercises: [] },
      {
        dayOfWeek: 3, name: 'Full Body B', isRestDay: false,
        exercises: [
          { name: 'Peso muerto', targetSets: 3, targetReps: 8, targetWeightKg: 50, restSeconds: 120 },
          { name: 'Press inclinado mancuernas', targetSets: 3, targetReps: 10, targetWeightKg: 18, restSeconds: 90 },
          { name: 'Jalón al pecho', targetSets: 3, targetReps: 10, targetWeightKg: 50, restSeconds: 90 },
          { name: 'Elevaciones laterales', targetSets: 3, targetReps: 15, targetWeightKg: 8, restSeconds: 60 },
          { name: 'Martillo bíceps', targetSets: 3, targetReps: 12, targetWeightKg: 14, restSeconds: 60 },
          { name: 'Fondos en banco', targetSets: 3, targetReps: 12, targetWeightKg: 0, restSeconds: 60 },
        ],
      },
      { dayOfWeek: 4, name: 'Descanso', isRestDay: true, exercises: [] },
      {
        dayOfWeek: 5, name: 'Full Body C', isRestDay: false,
        exercises: [
          { name: 'Prensa de pierna', targetSets: 3, targetReps: 12, targetWeightKg: 80, restSeconds: 120 },
          { name: 'Aperturas con mancuernas', targetSets: 3, targetReps: 12, targetWeightKg: 12, restSeconds: 90 },
          { name: 'Remo en polea baja', targetSets: 3, targetReps: 10, targetWeightKg: 45, restSeconds: 90 },
          { name: 'Encogimientos de hombros', targetSets: 3, targetReps: 15, targetWeightKg: 20, restSeconds: 60 },
          { name: 'Plancha', targetSets: 3, targetReps: 1, targetWeightKg: 0, restSeconds: 60, notes: 'Aguantar 30-60 segundos' },
        ],
      },
      { dayOfWeek: 6, name: 'Descanso', isRestDay: true, exercises: [] },
      { dayOfWeek: 7, name: 'Descanso', isRestDay: true, exercises: [] },
    ],
  },

  // ─── PUSH PULL LEGS (PPL) ────────────────────────────────────────────
  {
    id: 'push_pull_legs',
    name: 'Push / Pull / Legs',
    description: 'Divide los grupos musculares en 3 sesiones: empuje, tirón y piernas.',
    daysPerWeek: 3,
    level: 'intermediate',
    equipment: 'full_gym',
    days: [
      {
        dayOfWeek: 1, name: 'Push (Empuje)', isRestDay: false,
        exercises: [
          { name: 'Press banca', targetSets: 4, targetReps: 8, targetWeightKg: 60, restSeconds: 120 },
          { name: 'Press inclinado barra', targetSets: 3, targetReps: 10, targetWeightKg: 50, restSeconds: 90 },
          { name: 'Press militar', targetSets: 3, targetReps: 10, targetWeightKg: 40, restSeconds: 90 },
          { name: 'Elevaciones laterales', targetSets: 3, targetReps: 15, targetWeightKg: 10, restSeconds: 60 },
          { name: 'Extensión tríceps polea', targetSets: 3, targetReps: 12, targetWeightKg: 20, restSeconds: 60 },
          { name: 'Press francés', targetSets: 3, targetReps: 12, targetWeightKg: 20, restSeconds: 60 },
        ],
      },
      {
        dayOfWeek: 2, name: 'Pull (Tirón)', isRestDay: false,
        exercises: [
          { name: 'Dominadas', targetSets: 4, targetReps: 8, targetWeightKg: 0, restSeconds: 120 },
          { name: 'Remo con barra', targetSets: 4, targetReps: 8, targetWeightKg: 60, restSeconds: 120 },
          { name: 'Jalón al pecho', targetSets: 3, targetReps: 10, targetWeightKg: 60, restSeconds: 90 },
          { name: 'Remo en polea baja', targetSets: 3, targetReps: 10, targetWeightKg: 55, restSeconds: 90 },
          { name: 'Curl bíceps barra', targetSets: 3, targetReps: 12, targetWeightKg: 25, restSeconds: 60 },
          { name: 'Curl martillo', targetSets: 3, targetReps: 12, targetWeightKg: 14, restSeconds: 60 },
        ],
      },
      {
        dayOfWeek: 3, name: 'Legs (Piernas)', isRestDay: false,
        exercises: [
          { name: 'Sentadilla', targetSets: 4, targetReps: 8, targetWeightKg: 80, restSeconds: 180 },
          { name: 'Peso muerto rumano', targetSets: 3, targetReps: 10, targetWeightKg: 70, restSeconds: 120 },
          { name: 'Prensa de pierna', targetSets: 3, targetReps: 12, targetWeightKg: 100, restSeconds: 120 },
          { name: 'Extensión de cuádriceps', targetSets: 3, targetReps: 15, targetWeightKg: 40, restSeconds: 60 },
          { name: 'Curl de isquiotibiales', targetSets: 3, targetReps: 15, targetWeightKg: 35, restSeconds: 60 },
          { name: 'Elevación de gemelos', targetSets: 4, targetReps: 15, targetWeightKg: 0, restSeconds: 60 },
        ],
      },
      { dayOfWeek: 4, name: 'Descanso', isRestDay: true, exercises: [] },
      { dayOfWeek: 5, name: 'Descanso', isRestDay: true, exercises: [] },
      { dayOfWeek: 6, name: 'Descanso', isRestDay: true, exercises: [] },
      { dayOfWeek: 7, name: 'Descanso', isRestDay: true, exercises: [] },
    ],
  },

  // ─── UPPER / LOWER ───────────────────────────────────────────────────
  {
    id: 'upper_lower',
    name: 'Upper / Lower 4 días',
    description: 'Alterna entre tren superior e inferior en 4 sesiones semanales.',
    daysPerWeek: 4,
    level: 'intermediate',
    equipment: 'full_gym',
    days: [
      {
        dayOfWeek: 1, name: 'Upper A (Fuerza)', isRestDay: false,
        exercises: [
          { name: 'Press banca', targetSets: 4, targetReps: 6, targetWeightKg: 70, restSeconds: 180 },
          { name: 'Remo con barra', targetSets: 4, targetReps: 6, targetWeightKg: 65, restSeconds: 180 },
          { name: 'Press militar', targetSets: 3, targetReps: 8, targetWeightKg: 45, restSeconds: 120 },
          { name: 'Jalón al pecho', targetSets: 3, targetReps: 8, targetWeightKg: 65, restSeconds: 120 },
          { name: 'Curl bíceps barra', targetSets: 2, targetReps: 12, targetWeightKg: 25, restSeconds: 60 },
          { name: 'Extensión tríceps polea', targetSets: 2, targetReps: 12, targetWeightKg: 22, restSeconds: 60 },
        ],
      },
      {
        dayOfWeek: 2, name: 'Lower A (Fuerza)', isRestDay: false,
        exercises: [
          { name: 'Sentadilla', targetSets: 4, targetReps: 6, targetWeightKg: 90, restSeconds: 180 },
          { name: 'Peso muerto rumano', targetSets: 3, targetReps: 8, targetWeightKg: 75, restSeconds: 180 },
          { name: 'Prensa de pierna', targetSets: 3, targetReps: 10, targetWeightKg: 110, restSeconds: 120 },
          { name: 'Curl de isquiotibiales', targetSets: 3, targetReps: 12, targetWeightKg: 40, restSeconds: 90 },
          { name: 'Elevación de gemelos', targetSets: 3, targetReps: 15, targetWeightKg: 0, restSeconds: 60 },
        ],
      },
      { dayOfWeek: 3, name: 'Descanso', isRestDay: true, exercises: [] },
      {
        dayOfWeek: 4, name: 'Upper B (Volumen)', isRestDay: false,
        exercises: [
          { name: 'Press inclinado mancuernas', targetSets: 4, targetReps: 10, targetWeightKg: 22, restSeconds: 90 },
          { name: 'Remo en polea baja', targetSets: 4, targetReps: 10, targetWeightKg: 60, restSeconds: 90 },
          { name: 'Elevaciones laterales', targetSets: 3, targetReps: 15, targetWeightKg: 10, restSeconds: 60 },
          { name: 'Aperturas con mancuernas', targetSets: 3, targetReps: 12, targetWeightKg: 14, restSeconds: 60 },
          { name: 'Curl martillo', targetSets: 3, targetReps: 12, targetWeightKg: 16, restSeconds: 60 },
          { name: 'Press francés', targetSets: 3, targetReps: 12, targetWeightKg: 22, restSeconds: 60 },
        ],
      },
      {
        dayOfWeek: 5, name: 'Lower B (Volumen)', isRestDay: false,
        exercises: [
          { name: 'Sentadilla búlgara', targetSets: 3, targetReps: 10, targetWeightKg: 20, restSeconds: 120 },
          { name: 'Peso muerto', targetSets: 3, targetReps: 8, targetWeightKg: 80, restSeconds: 180 },
          { name: 'Extensión de cuádriceps', targetSets: 3, targetReps: 15, targetWeightKg: 45, restSeconds: 60 },
          { name: 'Curl de isquiotibiales', targetSets: 3, targetReps: 15, targetWeightKg: 38, restSeconds: 60 },
          { name: 'Hip thrust', targetSets: 3, targetReps: 12, targetWeightKg: 60, restSeconds: 90 },
          { name: 'Elevación de gemelos', targetSets: 4, targetReps: 15, targetWeightKg: 0, restSeconds: 60 },
        ],
      },
      { dayOfWeek: 6, name: 'Descanso', isRestDay: true, exercises: [] },
      { dayOfWeek: 7, name: 'Descanso', isRestDay: true, exercises: [] },
    ],
  },

  // ─── SIN EQUIPAMIENTO ────────────────────────────────────────────────
  {
    id: 'no_equipment',
    name: 'Sin equipamiento',
    description: 'Entrena en casa sin ningún equipo. Solo peso corporal.',
    daysPerWeek: 3,
    level: 'beginner',
    equipment: 'no_equipment',
    days: [
      {
        dayOfWeek: 1, name: 'Día A', isRestDay: false,
        exercises: [
          { name: 'Flexiones', targetSets: 3, targetReps: 12, targetWeightKg: 0, restSeconds: 60 },
          { name: 'Sentadilla sin peso', targetSets: 3, targetReps: 15, targetWeightKg: 0, restSeconds: 60 },
          { name: 'Remo invertido', targetSets: 3, targetReps: 10, targetWeightKg: 0, restSeconds: 60, notes: 'Usa una mesa o barra baja' },
          { name: 'Zancadas', targetSets: 3, targetReps: 12, targetWeightKg: 0, restSeconds: 60 },
          { name: 'Plancha', targetSets: 3, targetReps: 1, targetWeightKg: 0, restSeconds: 45, notes: 'Aguantar 30 segundos' },
        ],
      },
      { dayOfWeek: 2, name: 'Descanso', isRestDay: true, exercises: [] },
      {
        dayOfWeek: 3, name: 'Día B', isRestDay: false,
        exercises: [
          { name: 'Flexiones diamante', targetSets: 3, targetReps: 10, targetWeightKg: 0, restSeconds: 60 },
          { name: 'Sentadilla sumo', targetSets: 3, targetReps: 15, targetWeightKg: 0, restSeconds: 60 },
          { name: 'Dominadas', targetSets: 3, targetReps: 6, targetWeightKg: 0, restSeconds: 90, notes: 'Con asistencia si es necesario' },
          { name: 'Puente de glúteos', targetSets: 3, targetReps: 15, targetWeightKg: 0, restSeconds: 45 },
          { name: 'Mountain climbers', targetSets: 3, targetReps: 20, targetWeightKg: 0, restSeconds: 45 },
        ],
      },
      { dayOfWeek: 4, name: 'Descanso', isRestDay: true, exercises: [] },
      {
        dayOfWeek: 5, name: 'Día C', isRestDay: false,
        exercises: [
          { name: 'Flexiones inclinadas', targetSets: 3, targetReps: 12, targetWeightKg: 0, restSeconds: 60 },
          { name: 'Sentadilla pistol (asistida)', targetSets: 3, targetReps: 8, targetWeightKg: 0, restSeconds: 90 },
          { name: 'Superman', targetSets: 3, targetReps: 15, targetWeightKg: 0, restSeconds: 45 },
          { name: 'Fondos en silla', targetSets: 3, targetReps: 12, targetWeightKg: 0, restSeconds: 60 },
          { name: 'Plancha lateral', targetSets: 3, targetReps: 1, targetWeightKg: 0, restSeconds: 45, notes: 'Aguantar 20 seg cada lado' },
        ],
      },
      { dayOfWeek: 6, name: 'Descanso', isRestDay: true, exercises: [] },
      { dayOfWeek: 7, name: 'Descanso', isRestDay: true, exercises: [] },
    ],
  },
];

// Filtra plantillas según el objetivo y equipamiento del usuario
export function getRecommendedTemplates(
  equipment: 'full_gym' | 'home_gym' | 'no_equipment',
  availableDays: number,
  level: 'beginner' | 'intermediate' | 'advanced',
): RoutineTemplate[] {
  return ROUTINE_TEMPLATES.filter(t => {
    if (equipment === 'no_equipment' && t.equipment !== 'no_equipment') return false;
    if (t.daysPerWeek > availableDays + 1) return false;
    if (level === 'beginner' && t.level === 'advanced') return false;
    return true;
  });
}
