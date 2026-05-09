// DDL completo de FitTrack — todos los CREATE TABLE e índices

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS profile (
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
    weighing_mode            TEXT NOT NULL DEFAULT 'daily' CHECK(weighing_mode IN ('daily', 'weekly', 'monthly')),
    weighing_days            TEXT NOT NULL DEFAULT '[]',
    measurement_frequency    TEXT NOT NULL DEFAULT 'monthly' CHECK(measurement_frequency IN ('weekly', 'monthly')),
    avatar_uri               TEXT,
    created_at        INTEGER NOT NULL,
    updated_at        INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS weight_goal (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    target_weight_kg REAL NOT NULL,
    target_date      INTEGER NOT NULL,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS routines (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_routines_active ON routines(is_active);

  CREATE TABLE IF NOT EXISTS routine_days (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id   INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    day_of_week  INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
    name         TEXT NOT NULL,
    is_rest_day  INTEGER NOT NULL DEFAULT 0,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_routine_days_routine ON routine_days(routine_id);

  CREATE TABLE IF NOT EXISTS exercise_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_day_id INTEGER NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_exercategories_day ON exercise_categories(routine_day_id);

  CREATE TABLE IF NOT EXISTS exercises (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_day_id   INTEGER NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    target_sets      INTEGER NOT NULL DEFAULT 3,
    target_reps      INTEGER NOT NULL DEFAULT 10,
    target_weight_kg REAL NOT NULL DEFAULT 0,
    rest_seconds     INTEGER NOT NULL DEFAULT 90,
    notes            TEXT,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    category_id      INTEGER REFERENCES exercise_categories(id) ON DELETE SET NULL,
    is_deleted       INTEGER NOT NULL DEFAULT 0,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_exercises_day ON exercises(routine_day_id);

  CREATE TABLE IF NOT EXISTS workout_sessions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_day_id INTEGER NOT NULL REFERENCES routine_days(id),
    date           INTEGER NOT NULL,
    week_number    INTEGER NOT NULL,
    year           INTEGER NOT NULL,
    started_at     INTEGER NOT NULL,
    finished_at    INTEGER,
    notes          TEXT,
    created_at     INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_date ON workout_sessions(date);
  CREATE INDEX IF NOT EXISTS idx_sessions_week ON workout_sessions(year, week_number);
  CREATE INDEX IF NOT EXISTS idx_sessions_day ON workout_sessions(routine_day_id);

  CREATE TABLE IF NOT EXISTS set_logs (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id        INTEGER NOT NULL REFERENCES exercises(id),
    set_number         INTEGER NOT NULL,
    reps_done          INTEGER NOT NULL,
    weight_kg          REAL NOT NULL,
    is_warmup          INTEGER NOT NULL DEFAULT 0,
    rpe                INTEGER,
    created_at         INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_setlogs_session ON set_logs(workout_session_id);
  CREATE INDEX IF NOT EXISTS idx_setlogs_exercise ON set_logs(exercise_id);

  CREATE TABLE IF NOT EXISTS body_weights (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    weight_kg   REAL NOT NULL,
    date        INTEGER NOT NULL UNIQUE,
    notes       TEXT,
    created_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_bodyweights_date ON body_weights(date);

  CREATE TABLE IF NOT EXISTS body_measurements (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    date          INTEGER NOT NULL UNIQUE,
    chest_cm      REAL,
    waist_cm      REAL,
    hips_cm       REAL,
    left_arm_cm   REAL,
    right_arm_cm  REAL,
    left_leg_cm   REAL,
    right_leg_cm  REAL,
    notes         TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_measurements_date ON body_measurements(date);

  CREATE TABLE IF NOT EXISTS weekly_plans (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    week_number     INTEGER NOT NULL,
    year            INTEGER NOT NULL,
    generated_at    INTEGER NOT NULL,
    summary         TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    data_snapshot   TEXT NOT NULL,
    UNIQUE(week_number, year)
  );

  CREATE INDEX IF NOT EXISTS idx_weeklyplans_week ON weekly_plans(year, week_number);
`;
