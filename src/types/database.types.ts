// Mapeo exacto de filas SQLite — un tipo por tabla

export interface ProfileRow {
  id: number;
  name: string;
  age: number;
  height_cm: number;
  sex: 'male' | 'female' | 'other';
  initial_weight_kg: number;
  goal: 'lose_weight' | 'gain_muscle' | 'maintenance' | 'sport_performance' | 'body_recomp';
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  available_days: number;
  equipment: 'full_gym' | 'home_gym' | 'no_equipment';
  units: 'metric' | 'imperial';
  weighing_mode: 'daily' | 'weekly' | 'monthly';
  weighing_days: string; // JSON e.g. "[1,4]" for Mon+Thu, "[15]" for 15th of month, "[]" for daily
  measurement_frequency: 'weekly' | 'monthly';
  avatar_uri: string | null;
  created_at: number;
  updated_at: number;
}

export interface WeightGoalRow {
  id: number;
  target_weight_kg: number;
  target_date: number;
  created_at: number;
  updated_at: number;
}

export interface RoutineRow {
  id: number;
  name: string;
  is_active: 0 | 1;
  created_at: number;
  updated_at: number;
}

export interface RoutineDayRow {
  id: number;
  routine_id: number;
  day_of_week: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  is_rest_day: 0 | 1;
  sort_order: number;
  created_at: number;
}

export interface ExerciseCategoryRow {
  id: number;
  routine_day_id: number;
  name: string;
  sort_order: number;
  created_at: number;
}

export interface ExerciseRow {
  id: number;
  routine_day_id: number;
  name: string;
  target_sets: number;
  target_reps: number;       // 0 = sin objetivo de repeticiones
  target_weight_kg: number;  // 0 = sin objetivo de peso / peso corporal
  rest_seconds: number;
  notes: string | null;
  sort_order: number;
  category_id: number | null;
  is_deleted: 0 | 1;
  created_at: number;
  updated_at: number;
}

export interface WorkoutSessionRow {
  id: number;
  routine_day_id: number;
  date: number;
  week_number: number;
  year: number;
  started_at: number;
  finished_at: number | null;
  notes: string | null;
  created_at: number;
}

export interface SetLogRow {
  id: number;
  workout_session_id: number;
  exercise_id: number;
  set_number: number;
  reps_done: number;
  weight_kg: number;
  is_warmup: 0 | 1;
  rpe: number | null;
  created_at: number;
}

export interface BodyWeightRow {
  id: number;
  weight_kg: number;
  date: number;
  notes: string | null;
  created_at: number;
}

export interface BodyMeasurementRow {
  id: number;
  date: number;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  left_arm_cm: number | null;
  right_arm_cm: number | null;
  left_leg_cm: number | null;
  right_leg_cm: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface WeeklyPlanRow {
  id: number;
  week_number: number;
  year: number;
  generated_at: number;
  summary: string;
  recommendations: string;
  data_snapshot: string;
}
