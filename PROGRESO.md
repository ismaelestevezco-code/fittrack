# PROGRESO — FitTrack Development

## Estado actual
**Fase:** FASE 2 — Módulo de Entrenamientos (Core)  
**Estado de la fase:** ✅ COMPLETADA

## Tareas completadas en Fase 0
- [x] Proyecto Expo creado con template TypeScript (Expo SDK 54, React Native 0.81.5)
- [x] Dependencias instaladas: navegación, expo-sqlite, zustand, victory-native, date-fns, expo-haptics, react-native-svg
- [x] TypeScript configurado con path alias `@/` → `./src/`
- [x] babel.config.js con module-resolver
- [x] .eslintrc.js y .prettierrc configurados
- [x] Estructura de carpetas completa creada bajo `src/`
- [x] Design tokens completos (theme.ts, layout.ts, config.ts)
- [x] Tipos TypeScript completos (database.types.ts, domain.types.ts, navigation.types.ts)
- [x] Base de datos SQLite con 9 tablas, índices, WAL, FK, migraciones

## Tareas completadas en Fase 1
- [x] `src/repositories/ProfileRepository.ts` — CRUD completo (getFirst, create, update)
- [x] `src/stores/profileStore.ts` — Estado Zustand con loadProfile, setPendingSetup, createProfile, updateProfile
- [x] `src/components/common/Button.tsx` — Variantes primary/secondary/destructive, loading state
- [x] `src/components/common/Card.tsx` — Contenedor con shadow y borderRadius configurables
- [x] `src/components/common/Input.tsx` — Input con label, error, hint
- [x] `src/components/common/NumberInput.tsx` — Input numérico con botones +/-, min/max/step/decimales
- [x] `src/screens/onboarding/WelcomeScreen.tsx` — Logo, 3 features con iconos, CTA "Empezar ahora"
- [x] `src/screens/onboarding/ProfileSetupScreen.tsx` — Paso 1/2: nombre, edad, estatura, peso, sexo
- [x] `src/screens/onboarding/GoalSetupScreen.tsx` — Paso 2/2: objetivo, nivel, días, equipamiento
- [x] `src/navigation/MainTabNavigator.tsx` — 4 tabs con MaterialCommunityIcons
- [x] `src/navigation/RootNavigator.tsx` — Stack que cambia entre Onboarding/Main según perfil en store
- [x] `App.tsx` actualizado — SafeAreaProvider + RootNavigator tras init DB
- [x] `@expo/vector-icons` instalado (SDK 54 compatible)
- [x] `npx tsc --noEmit` pasa sin errores

## Tareas completadas en Fase 2
- [x] `src/repositories/RoutineRepository.ts` — CRUD rutinas + días. create() genera 7 días automáticamente
- [x] `src/repositories/ExerciseRepository.ts` — CRUD ejercicios con sort_order automático
- [x] `src/repositories/WorkoutSessionRepository.ts` — CRUD sesiones, getByWeek, finish()
- [x] `src/repositories/SetLogRepository.ts` — CRUD set_logs, getBySession, getByExercise
- [x] `src/utils/dateUtils.ts` — getWeekAndYear, toDayTimestamp, getWeekStart, formatWeekLabel, formatDuration
- [x] `src/stores/workoutStore.ts` — Estado Zustand completo: rutinas, días, sesiones, sets
- [x] `src/components/common/Modal.tsx` — Modal genérico con overlay semitransparente
- [x] `src/components/common/ConfirmModal.tsx` — Modal de confirmación con acciones primaria/destructiva
- [x] `src/components/common/EmptyState.tsx` — Placeholder con icono, título, descripción y CTA
- [x] `src/components/common/SectionHeader.tsx` — Cabecera de sección con acción opcional
- [x] `src/components/workout/DayCard.tsx` — Card de día con estado completado/en curso/pendiente/descanso
- [x] `src/components/workout/ExerciseItem.tsx` — Item de ejercicio con nombre, series×reps, peso
- [x] `src/components/workout/SetRow.tsx` — Fila de serie con steppers compactos de peso y reps
- [x] `src/components/workout/WeekSelector.tsx` — Selector de semana con prev/next y label formateado
- [x] `src/navigation/WorkoutStackNavigator.tsx` — Stack completo con stubs para Fase 4 (ExerciseHistory, WeekComparison)
- [x] `src/screens/workout/WorkoutHomeScreen.tsx` — Vista semanal con DayCards, WeekSelector y resumen
- [x] `src/screens/workout/DayDetailScreen.tsx` — Lista de ejercicios + botón iniciar/ver resumen
- [x] `src/screens/workout/ActiveWorkoutScreen.tsx` — Timer + SetRows + log en tiempo real + Finalizar
- [x] `src/screens/workout/WorkoutSummaryScreen.tsx` — Resumen post-entreno con comparativa vs sesión anterior
- [x] `src/screens/workout/EditDayScreen.tsx` — Gestión de ejercicios por día con modales de alta/edición
- [x] `src/screens/workout/RoutineManagerScreen.tsx` — Crear/renombrar/activar/eliminar rutinas
- [x] `src/screens/onboarding/GoalSetupScreen.tsx` — Actualizado: crea rutina inicial al completar onboarding
- [x] `src/navigation/MainTabNavigator.tsx` — Actualizado: usa WorkoutStackNavigator en tab Entreno
- [x] `npx tsc --noEmit` pasa sin errores

## Notas técnicas de Fase 2
- `RoutineRepository.create()` crea automáticamente 7 días (Lun–Dom) y desactiva las otras rutinas
- `WorkoutSessionRepository` usa semanas ISO (getISOWeek de date-fns)
- `workoutStore` carga exerciseCounts (map dayId→count) junto con loadActiveRoutine para evitar queries en render
- `SetRow` implementa steppers compactos propios (no usa NumberInput) para layout horizontal en ActiveWorkoutScreen
- `WorkoutStackNavigator` incluye stubs para ExerciseHistoryScreen y WeekComparisonScreen (Fase 4)
- El flujo de onboarding ahora crea la rutina inicial con `createRoutine('Mi primera rutina')` tras `createProfile`
- `ActiveWorkoutScreen` usa `navigation.replace('WorkoutSummary')` al finalizar para impedir volver con back
- `WorkoutSummaryScreen` usa `navigation.navigate('WorkoutHome')` al pulsar "Volver al inicio"

## Siguiente fase
**FASE 3 — Módulo de Cuerpo**

### Tareas pendientes de Fase 3
- [ ] `src/repositories/BodyWeightRepository.ts`
- [ ] `src/repositories/BodyMeasurementRepository.ts`
- [ ] `src/stores/bodyStore.ts`
- [ ] `src/hooks/useBodyProgress.ts`
- [ ] `src/components/body/WeightCard.tsx`
- [ ] `src/components/body/WeightChart.tsx`
- [ ] `src/components/body/PaceIndicator.tsx`
- [ ] `src/components/body/GoalProgressCard.tsx`
- [ ] `src/components/body/MeasurementRow.tsx`
- [ ] `src/navigation/BodyStackNavigator.tsx`
- [ ] `src/screens/body/BodyHomeScreen.tsx` — versión completa (reemplaza stub)
- [ ] `src/screens/body/LogWeightScreen.tsx`
- [ ] `src/screens/body/WeightHistoryScreen.tsx`
- [ ] `src/screens/body/MeasurementsScreen.tsx`
- [ ] `src/screens/body/WeightGoalScreen.tsx`
- [ ] `src/navigation/MainTabNavigator.tsx` — actualizar tab Body con BodyStackNavigator

## Frase para retomar en nueva sesión
"Retoma el desarrollo de FitTrack. Fases 0, 1 y 2 completadas. `npx tsc --noEmit` pasa sin errores. Continúa con la Fase 3 — Módulo de Cuerpo: BodyWeightRepository, BodyMeasurementRepository, bodyStore, hook useBodyProgress, componentes body (WeightCard, WeightChart, PaceIndicator, GoalProgressCard, MeasurementRow), BodyStackNavigator y las pantallas BodyHomeScreen (completa), LogWeightScreen, WeightHistoryScreen, MeasurementsScreen, WeightGoalScreen. También actualiza MainTabNavigator para usar BodyStackNavigator. Tienes permiso total para crear archivos y tomar decisiones técnicas dentro del CLAUDE.md. Trabaja de forma autónoma."
