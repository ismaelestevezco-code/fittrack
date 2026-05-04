// Tipos de parámetros de navegación por pantalla

export type OnboardingStackParamList = {
  Welcome: undefined;
  ProfileSetup: undefined;
  GoalSetup: undefined;
};

export type WorkoutStackParamList = {
  WorkoutHome: undefined;
  DayDetail: { routineDayId: number; date: number };
  ActiveWorkout: { routineDayId: number; sessionId: number; editMode?: boolean };
  WorkoutSummary: { sessionId: number };
  ExerciseHistory: { exerciseId: number; exerciseName: string };
  RoutineManager: undefined;
  EditDay: { routineDayId: number };
  WeekComparison: undefined;
};

export type BodyStackParamList = {
  BodyHome: undefined;
  LogWeight: undefined;
  WeightHistory: undefined;
  Measurements: undefined;
  WeightGoal: undefined;
};

export type PlanningStackParamList = {
  PlanningHome: undefined;
  PlanningHistory: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  EditPreferences: undefined;
};

export type MainTabParamList = {
  Workout: undefined;
  Body: undefined;
  Planning: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};
